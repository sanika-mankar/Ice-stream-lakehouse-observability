import os
import pytest
from dotenv import load_dotenv
from app.ingestion.generator import TransactionGenerator
from app.ingestion.producer import KafkaTransactionProducer

def test_real_kafka_integration():
    """
    Test publishing a single real event to the actual Kafka cluster.
    This ensures the pipeline: Python -> Kafka Producer -> Aiven Kafka works.
    """
    load_dotenv()
    
    bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS")
    if not bootstrap_servers or bootstrap_servers == "YOUR_KAFKA_BROKER_URL:9092":
        pytest.skip("KAFKA_BOOTSTRAP_SERVERS not properly configured for real integration test")
        
    topic = os.getenv("KAFKA_TOPIC_TRANSACTIONS", "ice-stream.transactions")
    
    try:
        # Initialize producer
        producer = KafkaTransactionProducer(topic=topic)
    except Exception as e:
        pytest.fail(f"Failed to initialize Kafka Producer: {e}")
    
    # Initialize generator with 0 error rate to ensure a valid event
    generator = TransactionGenerator(error_rate=0.0)
    
    # Generate one event
    event = generator.generate_event()
    
    # Produce
    try:
        producer.produce(event)
    except Exception as e:
        pytest.fail(f"Failed to produce message: {e}")
    
    # Ensure it flushes successfully
    producer.close()
    
    # Verify delivery metrics
    assert producer.metrics["failures"] == 0, f"Delivery failed. Metrics: {producer.metrics}"
    assert producer.metrics["attempted"] == 1, f"Attempted metric incorrect. Metrics: {producer.metrics}"
    assert producer.metrics["delivered"] == 1, f"Delivered metric incorrect. Metrics: {producer.metrics}"
