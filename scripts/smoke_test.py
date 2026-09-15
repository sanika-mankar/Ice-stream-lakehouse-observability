import os
import urllib.request
import json
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.datastream.connectors.kafka import KafkaSource, KafkaOffsetsInitializer
from pyflink.common.serialization import SimpleStringSchema
from pyflink.common.watermark_strategy import WatermarkStrategy
from pyflink.datastream.functions import MapFunction
from pyflink.common.typeinfo import Types
from dotenv import load_dotenv

load_dotenv()

class PrintAndFailFunction(MapFunction):
    """Prints the first message and fails to intentionally stop the Flink job after 1 message."""
    def map(self, value):
        print("\n" + "="*60)
        print("✅ SMOKE TEST PASSED! SUCCESSFULLY CONSUMED 1 REAL EVENT!")
        print("="*60)
        
        try:
            parsed = json.loads(value)
            print(json.dumps(parsed, indent=2))
        except:
            print(value)
            
        print("="*60 + "\n")
        
        # Stop the job after 1 message by raising a specialized exception
        raise Exception("SMOKE_TEST_COMPLETE: Successfully consumed 1 message, stopping job gracefully.")

def main():
    print("Starting Flink Native Windows Smoke Test...")
    
    # 1. Download JAR if needed
    jar_dir = os.path.join(os.getcwd(), "flink", "lib")
    os.makedirs(jar_dir, exist_ok=True)
    jar_name = "flink-sql-connector-kafka-3.1.0-1.18.jar"
    jar_path = os.path.join(jar_dir, jar_name)
    
    if not os.path.exists(jar_path):
        url = "https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-kafka/3.1.0-1.18/flink-sql-connector-kafka-3.1.0-1.18.jar"
        print(f"Downloading {jar_name}...")
        urllib.request.urlretrieve(url, jar_path)
        print("Download complete.")

    # 2. Setup Flink Env
    print("Initializing PyFlink Execution Environment...")
    env = StreamExecutionEnvironment.get_execution_environment()
    env.set_parallelism(1)
    
    # Format URI correctly for Windows
    jar_uri = f"file:///{jar_path.replace(chr(92), '/')}" 
    print(f"Loading JAR: {jar_uri}")
    env.add_jars(jar_uri)

    # 3. Setup Kafka Source
    bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS")
    topic = os.getenv("KAFKA_TOPIC_TRANSACTIONS")
    username = os.getenv("KAFKA_SASL_USERNAME")
    password = os.getenv("KAFKA_SASL_PASSWORD")
    ca_path = os.path.join(os.getcwd(), "secrets", "ca.pem")

    print(f"Connecting to Aiven Kafka at {bootstrap_servers}...")

    props = {
        "bootstrap.servers": bootstrap_servers,
        "group.id": "flink-smoke-test-group",
        "security.protocol": "SASL_SSL",
        "sasl.mechanism": "SCRAM-SHA-256",
        "sasl.jaas.config": f"org.apache.flink.kafka.shaded.org.apache.kafka.common.security.scram.ScramLoginModule required username=\"{username}\" password=\"{password}\";",
        "ssl.ca.location": ca_path
    }

    kafka_source = KafkaSource.builder() \
        .set_properties(props) \
        .set_topics(topic) \
        .set_starting_offsets(KafkaOffsetsInitializer.earliest()) \
        .set_value_only_deserializer(SimpleStringSchema()) \
        .build()

    stream = env.from_source(
        kafka_source, 
        WatermarkStrategy.no_watermarks(),
        "KafkaSource"
    )

    # 4. Consume and print exactly 1 message, then exit
    stream.map(PrintAndFailFunction(), output_type=Types.STRING())
    
    print("Executing Flink Job natively on Windows... Waiting for data...")
    try:
        env.execute("NativeWindowsSmokeTest")
    except Exception as e:
        if "SMOKE_TEST_COMPLETE" in str(e):
            print("Smoke test successfully exited after consuming 1 message.")
        else:
            print(f"Job failed with error: {e}")

if __name__ == '__main__':
    main()
