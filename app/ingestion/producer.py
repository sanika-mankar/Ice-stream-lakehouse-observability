import json
import logging
import os
from typing import Any, Dict

try:
    from confluent_kafka import Producer
except ImportError:
    Producer = None

try:
    import certifi
except ImportError:
    certifi = None

logger = logging.getLogger(__name__)


class KafkaTransactionProducer:
    """Produces e-commerce transactions to Kafka."""

    def __init__(self, topic: str):
        """Initialize the Kafka producer.
        
        Args:
            topic: The target Kafka topic for transactions
        """
        if Producer is None:
            raise ImportError("confluent_kafka is required. Run 'pip install confluent-kafka'")
            
        self.topic = topic
        self.metrics = {
            "attempted": 0,
            "delivered": 0,
            "failures": 0,
        }
        
        # Load configuration from environment
        bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS")
        if not bootstrap_servers:
            raise ValueError("KAFKA_BOOTSTRAP_SERVERS is not set in environment.")
            
        conf = {
            'bootstrap.servers': bootstrap_servers,
            'client.id': 'ice-stream-transaction-producer',
            'linger.ms': 10,  # Slight batching for throughput
            'compression.type': 'snappy',
        }

        # Apply security configurations if specified
        security_protocol = os.getenv("KAFKA_SECURITY_PROTOCOL", "PLAINTEXT")
        if security_protocol != "PLAINTEXT":
            conf['security.protocol'] = security_protocol
            
            sasl_mechanisms = os.getenv("KAFKA_SASL_MECHANISMS")
            if sasl_mechanisms:
                conf['sasl.mechanisms'] = sasl_mechanisms
                
            sasl_username = os.getenv("KAFKA_SASL_USERNAME")
            if sasl_username:
                conf['sasl.username'] = sasl_username
                
            sasl_password = os.getenv("KAFKA_SASL_PASSWORD")
            if sasl_password:
                conf['sasl.password'] = sasl_password
                
            ca_path = os.path.join("secrets", "ca.pem")
            if os.path.exists(ca_path):
                conf['ssl.ca.location'] = ca_path
            elif certifi:
                conf['ssl.ca.location'] = certifi.where()

        self._producer = Producer(conf)

    def _delivery_callback(self, err, msg):
        """Called upon message delivery or failure."""
        if err is not None:
            self.metrics["failures"] += 1
            logger.error(f"Failed to deliver message: {err}")
        else:
            self.metrics["delivered"] += 1
            # We log selectively at INFO level later to avoid spamming the console
            logger.debug(f"Message delivered to {msg.topic()} [{msg.partition()}] at offset {msg.offset()}")

    def produce(self, event: Dict[str, Any]) -> None:
        """Produce an event to the Kafka topic.
        
        Args:
            event: The transaction event dictionary
        """
        # Ensure event contains necessary fields for keying
        key = event.get("transaction_id", "unknown-txn")
        
        try:
            # We encode the payload as JSON utf-8
            payload = json.dumps(event).encode("utf-8")
            
            self._producer.produce(
                topic=self.topic,
                key=key.encode("utf-8"),
                value=payload,
                callback=self._delivery_callback
            )
            self.metrics["attempted"] += 1
            
            # Serve delivery callback queue (poll)
            self._producer.poll(0)
            
        except BufferError:
            logger.warning("Local producer queue is full. Flushing...")
            self._producer.flush()
            # Retry producing the message
            self._producer.produce(
                topic=self.topic,
                key=key.encode("utf-8"),
                value=payload,
                callback=self._delivery_callback
            )
            self.metrics["attempted"] += 1
        except Exception as e:
            self.metrics["failures"] += 1
            logger.error(f"Error producing event: {e}")

    def close(self) -> None:
        """Wait for pending messages to be delivered and close the producer."""
        logger.info("Flushing producer... waiting for deliveries.")
        remaining = self._producer.flush(timeout=10.0)
        if remaining > 0:
            logger.warning(f"Producer closed but {remaining} messages were still in queue.")
            self.metrics["failures"] += remaining
        else:
            logger.info("Producer flushed successfully.")
