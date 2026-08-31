import os
import json
import logging
from datetime import datetime, timezone
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.datastream.connectors.kafka import KafkaSource, KafkaOffsetsInitializer
from pyflink.common.serialization import SimpleStringSchema
from pyflink.common.watermark_strategy import WatermarkStrategy, TimestampAssigner
from pyflink.common.time import Time
from pyflink.datastream.functions import MapFunction, KeyedProcessFunction, ProcessWindowFunction
from pyflink.datastream.state import ValueStateDescriptor, StateTtlConfig
from pyflink.common.typeinfo import Types
from pyflink.datastream.window import TumblingProcessingTimeWindows

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

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
        
        for e_str in elements:
            e = json.loads(e_str)
            count += 1
            if e["is_valid"]:
                valid += 1
            else:
                invalid += 1
                
        error_rate = invalid / count if count > 0 else 0.0
        quality_score = (valid / count) * 100 if count > 0 else 0.0
        window_size_seconds = (context.window().end - context.window().start) / 1000
        throughput = count / window_size_seconds
        
        log_msg = (f"[METRICS] Window: {window_size_seconds}s | Processed: {count} | "
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

def main():
    logger.info("Initializing Flink Stream Processing Environment...")
    env = StreamExecutionEnvironment.get_execution_environment()
    
    # Configure Flink environment
    jar_path = "file:///opt/flink/lib/flink-sql-connector-kafka-3.1.0-1.18.jar"
    if not os.path.exists("/opt/flink/lib/flink-sql-connector-kafka-3.1.0-1.18.jar"):
        # Local development fallback
        jar_path = f"file://{os.path.abspath('flink/lib/flink-sql-connector-kafka-3.1.0-1.18.jar')}"
    env.add_jars(jar_path)

    env.set_parallelism(int(os.getenv("FLINK_PARALLELISM", "2")))
    
    # Enable checkpointing for Restart Strategy (Failure Recovery)
    checkpoint_interval = int(os.getenv("FLINK_CHECKPOINT_INTERVAL", "10000"))
    env.enable_checkpointing(checkpoint_interval)
    
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
            props["sasl.jaas.config"] = f"org.apache.kafka.common.security.scram.ScramLoginModule required username=\"{os.getenv('KAFKA_SASL_USERNAME')}\" password=\"{os.getenv('KAFKA_SASL_PASSWORD')}\";"
        else:
            props["sasl.jaas.config"] = f"org.apache.kafka.common.security.plain.PlainLoginModule required username=\"{os.getenv('KAFKA_SASL_USERNAME')}\" password=\"{os.getenv('KAFKA_SASL_PASSWORD')}\";"
            
        ca_path = os.getenv("KAFKA_SSL_CA_LOCATION", "/opt/flink/usrlib/secrets/ca.pem")
        if os.path.exists(ca_path):
            props["ssl.ca.location"] = ca_path

    kafka_source = KafkaSource.builder() \
        .set_properties(props) \
        .set_topics(topic) \
        .set_starting_offsets(KafkaOffsetsInitializer.latest()) \
        .set_value_only_deserializer(SimpleStringSchema()) \
        .build()

    stream = env.from_source(
        kafka_source, 
        WatermarkStrategy.no_watermarks(),
        "KafkaSource"
    )

    parsed_stream = stream.map(ValidateAndParseMap(), output_type=Types.STRING())

    watermark_strategy = WatermarkStrategy.for_bounded_out_of_orderness(Time.seconds(5)) \
        .with_timestamp_assigner(TransactionTimestampAssigner())
    
    timestamped_stream = parsed_stream.assign_timestamps_and_watermarks(watermark_strategy)

    ttl_hours = int(os.getenv("DUPLICATE_TTL_HOURS", "24"))
    
    dedup_stream = timestamped_stream \
        .key_by(lambda x: json.loads(x).get("event_id", "unknown")) \
        .process(DeduplicateProcessFunction(ttl_hours), output_type=Types.STRING())

    good_stream = dedup_stream.filter(lambda x: json.loads(x)["is_valid"])
    bad_stream = dedup_stream.filter(lambda x: not json.loads(x)["is_valid"])

    good_stream.map(lambda x: f"[GOOD STREAM] event_id={json.loads(x)['event_id']}").print()
    bad_stream.map(lambda x: f"[BAD STREAM] event_id={json.loads(x)['event_id']} errors={json.loads(x)['payload']['errors']}").print()

    metrics_stream = dedup_stream \
        .map(lambda x: ("global", x)) \
        .key_by(lambda x: x[0]) \
        .window(TumblingProcessingTimeWindows.of(Time.seconds(int(os.getenv("QUALITY_WINDOW_SECONDS", "5"))))) \
        .process(MetricsWindowFunction(), output_type=Types.STRING())
        
    metrics_stream.print()

    logger.info("Executing Flink Job...")
    env.execute("IceStream-Quality-Engine")

if __name__ == '__main__':
    main()
