import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure Python UDF worker runs in process mode (not loopback) on Windows
os.environ['_python_worker_execution_mode'] = 'process'

# Load local environment variables (.env)
load_dotenv()

# Auto-detect local project .jdk if JAVA_HOME not already configured
repo_root = Path(__file__).resolve().parent.parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))
os.environ["PYTHONPATH"] = f"{str(repo_root)}{os.pathsep}{os.environ.get('PYTHONPATH', '')}"

if "JAVA_HOME" not in os.environ:
    local_jdk_root = repo_root / ".jdk"
    if local_jdk_root.exists():
        candidates = [d for d in local_jdk_root.iterdir() if d.is_dir() and (d / "bin" / "java.exe").exists()]
        if candidates:
            jdk_path = str(candidates[0])
            os.environ["JAVA_HOME"] = jdk_path
            os.environ["PATH"] = f"{jdk_path}\\bin{os.pathsep}{os.environ.get('PATH', '')}"

jar_dir = os.path.abspath(os.path.join(str(repo_root), "flink", "lib"))
hadoop_cp = f"{jar_dir}\\*"
if "HADOOP_CLASSPATH" in os.environ:
    os.environ["HADOOP_CLASSPATH"] = f"{hadoop_cp}{os.pathsep}{os.environ['HADOOP_CLASSPATH']}"
else:
    os.environ["HADOOP_CLASSPATH"] = hadoop_cp

import json
import logging
import re
from decimal import Decimal
from datetime import datetime, timezone
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.datastream.connectors.kafka import KafkaSource, KafkaOffsetsInitializer
from pyflink.common.serialization import SimpleStringSchema
from pyflink.common.watermark_strategy import WatermarkStrategy, TimestampAssigner
from pyflink.common.time import Time
from pyflink.common import Duration, Row
from pyflink.datastream.functions import MapFunction, KeyedProcessFunction, ProcessWindowFunction
from pyflink.datastream.state import ValueStateDescriptor, StateTtlConfig
from pyflink.common.typeinfo import Types
from pyflink.datastream.window import TumblingProcessingTimeWindows
from pyflink.table import StreamTableEnvironment
from pyflink.table.types import DataTypes

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

VERIFICATION_FILE = os.path.abspath(os.path.join(str(repo_root), "data", "flink_verification.log"))

def append_to_verification_log(line: str):
    try:
        os.makedirs(os.path.dirname(VERIFICATION_FILE), exist_ok=True)
        with open(VERIFICATION_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
            f.flush()
    except Exception:
        pass

class ValidateAndParseMap(MapFunction):
    def __init__(self):
        self.engine = None

    def open(self, runtime_context):
        from app.validation.engine import ValidationEngine
        from app.validation.registry import ValidationRegistry
        from app.validation.required_fields import RequiredFieldsValidator
        from app.validation.types import TypeValidator
        from app.validation.business_rules import PositivePriceValidator, ValidStatusValidator
        
        registry = ValidationRegistry()
        registry.register(RequiredFieldsValidator())
        registry.register(TypeValidator())
        registry.register(PositivePriceValidator())
        registry.register(ValidStatusValidator())
        self.engine = ValidationEngine(registry)

    def map(self, value):
        try:
            data = json.loads(value)
            
            schema_version = data.get("schema_version")
            if not schema_version:
                return json.dumps({"is_valid": False, "event_id": data.get("event_id", "unknown"), "payload": {"data": data, "errors": ["Missing schema_version (DQ-008)"]}})
            if schema_version != "1.0":
                return json.dumps({"is_valid": False, "event_id": data.get("event_id", "unknown"), "payload": {"data": data, "errors": [f"Unknown schema_version '{schema_version}' (DQ-008)"]}})
                
            result = self.engine.validate_event(data)
            payload = {"data": data, "errors": result.errors}
            
            return json.dumps({"is_valid": result.is_valid, "event_id": data.get("event_id", "unknown"), "payload": payload})
        except json.JSONDecodeError as e:
            return json.dumps({"is_valid": False, "event_id": "invalid-json", "payload": {"data": value, "errors": [f"Invalid JSON: {str(e)}"]}})
        except Exception as e:
            return json.dumps({"is_valid": False, "event_id": "unknown", "payload": {"data": value, "errors": [f"Validation crash: {str(e)}"]}})


class DeduplicateProcessFunction(KeyedProcessFunction):
    def __init__(self, ttl_hours: int):
        self.ttl_hours = ttl_hours
        self.seen_state = None

    def open(self, runtime_context):
        state_desc = ValueStateDescriptor("seen_events", Types.BOOLEAN())
        ttl_config = StateTtlConfig.new_builder(Time.hours(self.ttl_hours)) \
            .set_update_type(StateTtlConfig.UpdateType.OnCreateAndWrite) \
            .set_state_visibility(StateTtlConfig.StateVisibility.NeverReturnExpired) \
            .build()
        state_desc.enable_time_to_live(ttl_config)
        self.seen_state = runtime_context.get_state(state_desc)

    def process_element(self, value, ctx: 'KeyedProcessFunction.Context'):
        obj = json.loads(value)
        is_valid = obj.get("is_valid")
        
        if not is_valid:
            yield value
            return
            
        if self.seen_state.value():
            obj["is_valid"] = False
            obj["payload"]["errors"].append("Duplicate event detected (DQ-006)")
            yield json.dumps(obj)
        else:
            self.seen_state.update(True)
            yield value

class MetricsWindowFunction(ProcessWindowFunction):
    def process(self, key, context, elements):
        count = 0
        valid = 0
        invalid = 0
        
        for item in elements:
            try:
                raw = item[1] if isinstance(item, (tuple, list)) else item
                e = json.loads(raw) if isinstance(raw, str) else raw
                count += 1
                if e.get("is_valid", False):
                    valid += 1
                else:
                    invalid += 1
            except Exception:
                count += 1
                invalid += 1
                
        error_rate = invalid / count if count > 0 else 0.0
        quality_score = (valid / count) * 100 if count > 0 else 0.0
        window_size_seconds = (context.window().end - context.window().start) / 1000
        throughput = count / window_size_seconds if window_size_seconds > 0 else 0.0
        
        log_msg = (f"[METRICS] Window: {window_size_seconds:.0f}s | Processed: {count} | "
                   f"Valid: {valid} | Invalid: {invalid} | Error Rate: {error_rate:.2%} | "
                   f"Quality Score: {quality_score:.1f}/100 | Throughput: {throughput:.1f} events/sec")
        yield log_msg

class TransactionTimestampAssigner(TimestampAssigner):
    def extract_timestamp(self, value, record_timestamp: int) -> int:
        try:
            obj = json.loads(value)
            event_time_str = obj["payload"]["data"].get("event_time", "")
            if event_time_str:
                event_time_str = event_time_str.replace("Z", "+00:00")
                dt = datetime.fromisoformat(event_time_str)
                return int(dt.timestamp() * 1000)
        except Exception:
            pass
        return record_timestamp


# --- Row Conversion Helpers for Iceberg Tables ---

def to_clean_iceberg_row(x: str) -> Row:
    d = json.loads(x)
    data = d.get("payload", {}).get("data", {})
    
    et_str = data.get("event_time", "")
    et_dt = None
    if et_str:
        try:
            et_dt = datetime.fromisoformat(et_str.replace("Z", "+00:00"))
        except Exception:
            et_dt = datetime.now(timezone.utc)
    else:
        et_dt = datetime.now(timezone.utc)
        
    qty = int(data.get("quantity", 0))
    up = Decimal(str(data.get("unit_price", "0.00")))
    meta = json.dumps(data.get("metadata")) if data.get("metadata") is not None else None
    
    return Row(
        str(data.get("event_id", d.get("event_id", ""))),
        str(data.get("transaction_id", "")),
        et_dt,
        str(data.get("customer_id", "")),
        str(data.get("product_id", "")),
        qty,
        up,
        str(data.get("currency", "USD")),
        str(data.get("status", "PENDING")),
        str(data.get("payment_method", "")),
        str(data.get("source", "")),
        str(data.get("schema_version", "1.0")),
        meta
    )


def to_dlq_iceberg_row(x: str) -> Row:
    d = json.loads(x)
    payload = d.get("payload", {})
    raw_data = payload.get("data", {})
    errors = payload.get("errors", [])
    
    event_id = str(d.get("event_id", "unknown"))
    tx_id = str(raw_data.get("transaction_id")) if isinstance(raw_data, dict) and raw_data.get("transaction_id") else None
    
    et_dt = None
    if isinstance(raw_data, dict) and raw_data.get("event_time"):
        try:
            et_dt = datetime.fromisoformat(raw_data["event_time"].replace("Z", "+00:00"))
        except Exception:
            pass
            
    now_dt = datetime.now(timezone.utc)
    
    failed_rules = []
    error_msgs = []
    for err in errors:
        err_str = str(err)
        error_msgs.append(err_str)
        m = re.search(r'(DQ-\d{3})', err_str)
        if m:
            failed_rules.append(m.group(1))
        elif "JSON" in err_str:
            failed_rules.append("DQ-PARSE")
        else:
            failed_rules.append("DQ-UNKNOWN")
            
    category = "VALIDATION_FAILED"
    if any("DQ-006" in r for r in failed_rules):
        category = "DUPLICATE"
    elif any("DQ-008" in r for r in failed_rules) or any("JSON" in r for r in failed_rules):
        category = "SCHEMA_VIOLATION"
        
    raw_payload_str = json.dumps(raw_data) if isinstance(raw_data, dict) else str(raw_data)
    schema_ver = str(raw_data.get("schema_version")) if isinstance(raw_data, dict) and raw_data.get("schema_version") else None
    source = str(raw_data.get("source")) if isinstance(raw_data, dict) and raw_data.get("source") else None
    recoverable = False if category == "SCHEMA_VIOLATION" else True
    
    return Row(
        event_id,
        tx_id,
        et_dt,
        now_dt,
        category,
        failed_rules,
        error_msgs,
        raw_payload_str,
        schema_ver,
        source,
        recoverable
    )


def main():
    logger.info("Initializing Flink Stream Processing Environment...")
    env = StreamExecutionEnvironment.get_execution_environment()
    env.set_parallelism(int(os.getenv("FLINK_PARALLELISM", "1")))
    
    # 1. Add all required JARs (Kafka, Iceberg, S3FileIO, SQLite JDBC, Shaded Hadoop)
    jar_dir = os.path.join(os.getcwd(), "flink", "lib")
    jars = [
        os.path.join(jar_dir, "flink-sql-connector-kafka-3.1.0-1.18.jar"),
        os.path.join(jar_dir, "flink-shaded-hadoop-2-uber-2.8.3-10.0.jar"),
        os.path.join(jar_dir, "sqlite-jdbc-3.45.1.0.jar"),
        os.path.join(jar_dir, "iceberg-flink-runtime-1.18-1.5.2.jar"),
        os.path.join(jar_dir, "iceberg-aws-bundle-1.5.2.jar"),
    ]
    for jar in jars:
        if os.path.exists(jar):
            uri = f"file:///{jar.replace(chr(92), '/')}"
            env.add_jars(uri)
        else:
            logger.warning(f"JAR not found: {jar}")

    # 2. Enable checkpointing (10s interval) for Iceberg snapshot commits & failure recovery
    checkpoint_interval = int(os.getenv("FLINK_CHECKPOINT_INTERVAL", "10000"))
    env.enable_checkpointing(checkpoint_interval)
    logger.info(f"Checkpointing enabled at {checkpoint_interval}ms interval")

    # 3. Create Table Environment & Register Iceberg Catalog backed by Backblaze B2
    t_env = StreamTableEnvironment.create(env)
    
    catalog_name = os.getenv("ICEBERG_CATALOG_NAME", "ice_stream_catalog")
    database_name = os.getenv("ICEBERG_DATABASE", "ice_stream")
    bucket_name = os.getenv("B2_BUCKET_NAME", "ice-stream-lakehouse")
    warehouse = os.getenv("ICEBERG_WAREHOUSE", f"s3://{bucket_name}/warehouse")
    endpoint = os.getenv("B2_ENDPOINT", "https://s3.us-east-005.backblazeb2.com")
    access_key = os.getenv("B2_ACCESS_KEY_ID")
    secret_key = os.getenv("B2_SECRET_ACCESS_KEY")
    region = os.getenv("B2_REGION", "us-east-005")
    db_path = os.path.abspath(os.path.join(os.getcwd(), "data", "iceberg_catalog.db")).replace("\\", "/")

    catalog_sql = f"""
    CREATE CATALOG {catalog_name} WITH (
        'type'='iceberg',
        'catalog-impl'='org.apache.iceberg.jdbc.JdbcCatalog',
        'uri'='jdbc:sqlite:{db_path}',
        'warehouse'='{warehouse}',
        'io-impl'='org.apache.iceberg.aws.s3.S3FileIO',
        's3.endpoint'='{endpoint}',
        's3.path-style-access'='true',
        's3.access-key-id'='{access_key}',
        's3.secret-access-key'='{secret_key}',
        'client.region'='{region}'
    )
    """
    try:
        t_env.execute_sql(catalog_sql)
        logger.info(f"Iceberg catalog '{catalog_name}' configured with warehouse '{warehouse}'")
    except Exception as e:
        logger.warning(f"Catalog registration note: {e}")
    
    # 4. Configure Kafka Source
    bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    topic = os.getenv("KAFKA_TOPIC_TRANSACTIONS", "ice-stream.transactions")
    security_protocol = os.getenv("KAFKA_SECURITY_PROTOCOL", "PLAINTEXT")
    
    logger.info(f"Connecting to Kafka at {bootstrap_servers}, topic {topic}")
    
    props = {
        "bootstrap.servers": bootstrap_servers,
        "group.id": "flink-quality-engine"
    }
    if security_protocol != "PLAINTEXT":
        props["security.protocol"] = security_protocol
        props["sasl.mechanism"] = os.getenv("KAFKA_SASL_MECHANISMS", "PLAIN")
        sasl_mechanism = os.getenv("KAFKA_SASL_MECHANISMS", "PLAIN")
        if sasl_mechanism.startswith("SCRAM"):
            props["sasl.jaas.config"] = f"org.apache.flink.kafka.shaded.org.apache.kafka.common.security.scram.ScramLoginModule required username=\"{os.getenv('KAFKA_SASL_USERNAME')}\" password=\"{os.getenv('KAFKA_SASL_PASSWORD')}\";"
        else:
            props["sasl.jaas.config"] = f"org.apache.flink.kafka.shaded.org.apache.kafka.common.security.plain.PlainLoginModule required username=\"{os.getenv('KAFKA_SASL_USERNAME')}\" password=\"{os.getenv('KAFKA_SASL_PASSWORD')}\";"
            
        ca_path = os.getenv("KAFKA_SSL_CA_LOCATION", "/opt/flink/usrlib/secrets/ca.pem")
        local_ca = os.path.abspath(os.path.join(os.getcwd(), "secrets", "ca.pem"))
        effective_ca = None
        if os.path.exists(ca_path):
            effective_ca = ca_path
        elif os.path.exists(local_ca):
            effective_ca = local_ca
            
        if effective_ca:
            clean_ca = effective_ca.replace("\\", "/")
            props["ssl.ca.location"] = clean_ca
            props["ssl.truststore.type"] = "PEM"
            try:
                with open(effective_ca, "r") as f:
                    props["ssl.truststore.certificates"] = f.read()
            except Exception:
                props["ssl.truststore.location"] = clean_ca

    starting_offsets = KafkaOffsetsInitializer.earliest() if os.getenv("KAFKA_STARTING_OFFSETS", "earliest").lower() == "earliest" else KafkaOffsetsInitializer.latest()

    kafka_source = KafkaSource.builder() \
        .set_properties(props) \
        .set_topics(topic) \
        .set_starting_offsets(starting_offsets) \
        .set_value_only_deserializer(SimpleStringSchema()) \
        .build()

    stream = env.from_source(
        kafka_source, 
        WatermarkStrategy.no_watermarks(),
        "KafkaSource"
    )

    parsed_stream = stream.map(ValidateAndParseMap(), output_type=Types.STRING())

    watermark_strategy = WatermarkStrategy.for_bounded_out_of_orderness(Duration.of_seconds(5)) \
        .with_timestamp_assigner(TransactionTimestampAssigner())
    
    timestamped_stream = parsed_stream.assign_timestamps_and_watermarks(watermark_strategy)

    ttl_hours = int(os.getenv("DUPLICATE_TTL_HOURS", "24"))
    
    dedup_stream = timestamped_stream \
        .key_by(lambda x: json.loads(x).get("event_id", "unknown")) \
        .process(DeduplicateProcessFunction(ttl_hours), output_type=Types.STRING())

    good_stream = dedup_stream.filter(lambda x: json.loads(x)["is_valid"])
    bad_stream = dedup_stream.filter(lambda x: not json.loads(x)["is_valid"])

    # 5. Logging & metrics hooks
    def log_good(x):
        d = json.loads(x)
        msg = f"[VALID STREAM] event_id={d.get('event_id')}"
        append_to_verification_log(msg)
        print(msg)
        return msg

    def log_bad(x):
        d = json.loads(x)
        msg = f"[INVALID STREAM] event_id={d.get('event_id')} errors={d.get('payload', {}).get('errors')}"
        append_to_verification_log(msg)
        print(msg)
        return msg

    def log_metric(m):
        append_to_verification_log(m)
        print(m)
        return m

    good_stream.map(log_good, output_type=Types.STRING()).print()
    bad_stream.map(log_bad, output_type=Types.STRING()).print()

    metrics_stream = dedup_stream \
        .map(lambda x: ("global", x), output_type=Types.TUPLE([Types.STRING(), Types.STRING()])) \
        .key_by(lambda x: x[0], key_type=Types.STRING()) \
        .window(TumblingProcessingTimeWindows.of(Time.seconds(int(os.getenv("QUALITY_WINDOW_SECONDS", "10"))))) \
        .process(MetricsWindowFunction(), output_type=Types.STRING())
        
    metrics_stream.map(log_metric, output_type=Types.STRING()).print()

    # 6. Map to Iceberg Table Rows and attach to StatementSet
    clean_row_type = Types.ROW_NAMED(
        ["event_id", "transaction_id", "event_time", "customer_id", "product_id", "quantity", "unit_price", "currency", "status", "payment_method", "source", "schema_version", "metadata"],
        [Types.STRING(), Types.STRING(), Types.SQL_TIMESTAMP(), Types.STRING(), Types.STRING(), Types.INT(), Types.BIG_DEC(), Types.STRING(), Types.STRING(), Types.STRING(), Types.STRING(), Types.STRING(), Types.STRING()]
    )
    clean_row_stream = good_stream.map(to_clean_iceberg_row, output_type=clean_row_type)
    clean_tab = t_env.from_data_stream(clean_row_stream)

    dlq_row_type = Types.ROW_NAMED(
        ["event_id", "transaction_id", "event_time", "failure_timestamp", "failure_category", "failed_rules", "error_messages", "raw_payload", "schema_version", "source", "recoverable"],
        [Types.STRING(), Types.STRING(), Types.SQL_TIMESTAMP(), Types.SQL_TIMESTAMP(), Types.STRING(), Types.BASIC_ARRAY(Types.STRING()), Types.BASIC_ARRAY(Types.STRING()), Types.STRING(), Types.STRING(), Types.STRING(), Types.BOOLEAN()]
    )
    dlq_row_stream = bad_stream.map(to_dlq_iceberg_row, output_type=dlq_row_type)
    dlq_tab = t_env.from_data_stream(dlq_row_stream)

    clean_table_target = f"{catalog_name}.{database_name}.transactions_clean"
    dlq_table_target = f"{catalog_name}.{database_name}.transactions_dlq"

    statement_set = t_env.create_statement_set()
    statement_set.add_insert(clean_table_target, clean_tab)
    statement_set.add_insert(dlq_table_target, dlq_tab)
    statement_set.attach_as_datastream()
    logger.info(f"Attached Iceberg sinks: '{clean_table_target}' and '{dlq_table_target}'")

    import threading
    import time
    
    os.makedirs(os.path.dirname(VERIFICATION_FILE), exist_ok=True)
    with open(VERIFICATION_FILE, "w", encoding="utf-8") as f:
        f.write(f"--- Flink Quality Engine Stream Started: {datetime.now(timezone.utc).isoformat()} ---\n")

    def live_tail():
        try:
            with open(VERIFICATION_FILE, "r", encoding="utf-8") as f:
                while True:
                    line = f.readline()
                    if line:
                        sys.stdout.write(line)
                        sys.stdout.flush()
                    else:
                        time.sleep(0.1)
        except Exception:
            pass

    tailer = threading.Thread(target=live_tail, daemon=True)
    tailer.start()

    logger.info("Executing Flink Job with Iceberg Sinks...")
    env.execute("IceStream-Quality-Engine")

if __name__ == '__main__':
    main()


