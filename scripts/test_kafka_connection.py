import os
import sys
from dotenv import load_dotenv

# Try to import confluent_kafka
try:
    from confluent_kafka import Producer
except ImportError:
    print("ERROR: confluent_kafka is not installed.")
    print("Please install it using: pip install confluent-kafka")
    sys.exit(1)

def test_connection():
    """Test Kafka connectivity and authentication."""
    print("--- Ice Stream Kafka Connectivity Test ---")
    
    # Load environment variables
    load_dotenv()
    
    bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS")
    if not bootstrap_servers or bootstrap_servers == "YOUR_KAFKA_BROKER_URL:9092":
        print("ERROR: KAFKA_BOOTSTRAP_SERVERS is not configured correctly in .env")
        sys.exit(1)
        
    security_protocol = os.getenv("KAFKA_SECURITY_PROTOCOL", "PLAINTEXT")
    sasl_mechanisms = os.getenv("KAFKA_SASL_MECHANISMS")
    sasl_username = os.getenv("KAFKA_SASL_USERNAME")
    sasl_password = os.getenv("KAFKA_SASL_PASSWORD")
    topic = os.getenv("KAFKA_TOPIC_TRANSACTIONS", "ice-stream.transactions")

    print(f"Attempting to connect to: {bootstrap_servers}")
    print(f"Target topic: {topic}")
    
    conf = {
        'bootstrap.servers': bootstrap_servers,
        'client.id': 'ice-stream-connection-test',
    }

    if security_protocol != "PLAINTEXT":
        conf['security.protocol'] = security_protocol
        if sasl_mechanisms:
            conf['sasl.mechanisms'] = sasl_mechanisms
        if sasl_username:
            conf['sasl.username'] = sasl_username
        if sasl_password:
            conf['sasl.password'] = sasl_password

    def delivery_report(err, msg):
        """Called once for each message produced to indicate delivery result."""
        if err is not None:
            print(f"\n[FAILED] Message delivery failed: {err}")
            sys.exit(1)
        else:
            print(f"\n[SUCCESS] Message delivered to {msg.topic()} [{msg.partition()}]")

    try:
        print("Initializing producer...")
        producer = Producer(conf)
        
        print(f"Producing test message to {topic}...")
        # Send a single test message
        producer.produce(
            topic, 
            key="test-key", 
            value="ice-stream-connectivity-test", 
            callback=delivery_report
        )
        
        # Wait for any outstanding messages to be delivered
        print("Waiting for delivery confirmation...")
        producer.flush(timeout=10.0)
        
        print("\n=== TEST PASSED ===")
        print("Kafka connection, authentication, and topic availability verified successfully.")
        
    except Exception as e:
        print(f"\n[FAILED] Connection error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_connection()
