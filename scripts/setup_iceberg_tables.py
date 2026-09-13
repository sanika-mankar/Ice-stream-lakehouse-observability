import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure Python UDF worker runs in process mode
os.environ['_python_worker_execution_mode'] = 'process'

load_dotenv()

# Auto-detect local project .jdk if JAVA_HOME not already configured
repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

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

from pyflink.datastream import StreamExecutionEnvironment
from pyflink.table import StreamTableEnvironment


def setup_iceberg():
    print("--- Iceberg Catalog & Table Setup (Backblaze B2) ---")

    bucket_name = os.getenv("B2_BUCKET_NAME", "ice-stream-lakehouse")
    endpoint = os.getenv("B2_ENDPOINT", "https://s3.us-east-005.backblazeb2.com")
    access_key = os.getenv("B2_ACCESS_KEY_ID")
    secret_key = os.getenv("B2_SECRET_ACCESS_KEY")
    region = os.getenv("B2_REGION", "us-east-005")

    catalog_name = os.getenv("ICEBERG_CATALOG_NAME", "ice_stream_catalog")
    database_name = os.getenv("ICEBERG_DATABASE", "ice_stream")
    warehouse = os.getenv("ICEBERG_WAREHOUSE", f"s3://{bucket_name}/warehouse")

    clean_table = os.getenv("ICEBERG_CLEAN_TABLE", "transactions_clean")
    dlq_table = os.getenv("ICEBERG_DLQ_TABLE", "transactions_dlq")

    print(f"Catalog:   {catalog_name}")
    print(f"Database:  {database_name}")
    print(f"Warehouse: {warehouse}")
    print(f"Endpoint:  {endpoint}")
    print(f"Region:    {region}")

    # Initialize Flink environments
    print("\n1. Initializing Flink Stream & Table environments...")
    env = StreamExecutionEnvironment.get_execution_environment()
    env.set_parallelism(1)

    jar_dir = os.path.join(os.getcwd(), "flink", "lib")
    jars = [
        os.path.join(jar_dir, "flink-sql-connector-kafka-3.1.0-1.18.jar"),
        os.path.join(jar_dir, "flink-shaded-hadoop-2-uber-2.8.3-10.0.jar"),
        os.path.join(jar_dir, "sqlite-jdbc-3.45.1.0.jar"),
        os.path.join(jar_dir, "iceberg-flink-runtime-1.18-1.5.2.jar"),
        os.path.join(jar_dir, "iceberg-aws-bundle-1.5.2.jar"),
    ]

    jar_uris = []
    for jar in jars:
        if os.path.exists(jar):
            uri = f"file:///{jar.replace(chr(92), '/')}"
            jar_uris.append(uri)
            env.add_jars(uri)
        else:
            print(f"[WARNING] Missing JAR: {jar}")

    t_env = StreamTableEnvironment.create(env)
    print("   [OK] Environments initialized.")

    # 2. Create Iceberg Catalog
    db_env = os.getenv("ICEBERG_CATALOG_DB_PATH", "data/iceberg_catalog.db")
    db_path = str(Path(db_env).resolve()).replace("\\", "/")
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
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
        print(f"   [OK] Catalog '{catalog_name}' registered.")
    except Exception as e:
        print(f"[FAILED] Catalog creation failed: {e}")
        sys.exit(1)

    # 3. Create Database / Namespace
    print(f"\n3. Creating Database '{catalog_name}.{database_name}'...")
    try:
        t_env.execute_sql(f"CREATE DATABASE IF NOT EXISTS {catalog_name}.{database_name}")
        print(f"   [OK] Database '{database_name}' ready.")
    except Exception as e:
        print(f"[FAILED] Database creation failed: {e}")
        sys.exit(1)

    # 4. Create Clean Table (transactions_clean)
    print(f"\n4. Creating Clean Table '{catalog_name}.{database_name}.{clean_table}'...")
    clean_table_sql = f"""
    CREATE TABLE IF NOT EXISTS {catalog_name}.{database_name}.{clean_table} (
        event_id         STRING NOT NULL,
        transaction_id   STRING NOT NULL,
        event_time       TIMESTAMP(3) WITH LOCAL TIME ZONE,
        customer_id      STRING NOT NULL,
        product_id       STRING NOT NULL,
        quantity         INT NOT NULL,
        unit_price       DECIMAL(10, 2) NOT NULL,
        currency         STRING NOT NULL,
        status           STRING NOT NULL,
        payment_method   STRING NOT NULL,
        source           STRING NOT NULL,
        schema_version   STRING NOT NULL,
        metadata         STRING,
        PRIMARY KEY (event_id) NOT ENFORCED
    ) WITH (
        'format-version' = '2',
        'write.format.default' = 'parquet'
    )
    """
    try:
        t_env.execute_sql(clean_table_sql)
        print(f"   [OK] Clean table '{clean_table}' created successfully.")
    except Exception as e:
        print(f"[FAILED] Clean table creation failed: {e}")
        sys.exit(1)

    # 5. Create DLQ Table (transactions_dlq)
    print(f"\n5. Creating DLQ Table '{catalog_name}.{database_name}.{dlq_table}'...")
    dlq_table_sql = f"""
    CREATE TABLE IF NOT EXISTS {catalog_name}.{database_name}.{dlq_table} (
        event_id          STRING NOT NULL,
        transaction_id    STRING,
        event_time        TIMESTAMP(3) WITH LOCAL TIME ZONE,
        failure_timestamp TIMESTAMP(3) WITH LOCAL TIME ZONE,
        failure_category  STRING NOT NULL,
        failed_rules      ARRAY<STRING>,
        error_messages    ARRAY<STRING>,
        raw_payload       STRING NOT NULL,
        schema_version    STRING,
        source            STRING,
        recoverable       BOOLEAN,
        PRIMARY KEY (event_id) NOT ENFORCED
    ) WITH (
        'format-version' = '2',
        'write.format.default' = 'parquet'
    )
    """
    try:
        t_env.execute_sql(dlq_table_sql)
        print(f"   [OK] DLQ table '{dlq_table}' created successfully.")
    except Exception as e:
        print(f"[FAILED] DLQ table creation failed: {e}")
        sys.exit(1)

    # 6. Verify Tables Exist in Catalog
    print("\n6. Verifying tables in catalog...")
    tables = t_env.execute_sql(f"SHOW TABLES IN {catalog_name}.{database_name}").print()
    
    print("\n=== ICEBERG CATALOG & TABLE SETUP PASSED ===")
    print("Clean and DLQ tables successfully defined and backed by Backblaze B2.")


if __name__ == "__main__":
    setup_iceberg()
