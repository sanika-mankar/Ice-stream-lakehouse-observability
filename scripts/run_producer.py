import os
import sys
import time
import signal
import logging
from dotenv import load_dotenv

# Ensure the app module can be found
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.ingestion.generator import TransactionGenerator
from app.ingestion.producer import KafkaTransactionProducer

# Configure basic logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("ProducerService")

# Global flag for graceful shutdown
running = True

def signal_handler(sig, frame):
    """Handle CTRL+C or SIGTERM for graceful shutdown."""
    global running
    logger.info("Shutdown signal received. Initiating graceful shutdown...")
    running = False

def main():
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    load_dotenv()
    
    # Load configuration
    topic = os.getenv("KAFKA_TOPIC_TRANSACTIONS", "ice-stream.transactions")
    events_per_second = float(os.getenv("EVENTS_PER_SECOND", "10"))
    error_rate = float(os.getenv("EVENT_FAILURE_RATE", "0.05"))
    max_events = int(os.getenv("MAX_EVENTS", "1000"))
    
    logger.info(f"Starting Ice Stream Producer")
    logger.info(f"Target Topic: {topic}")
    logger.info(f"Rate: {events_per_second} events/sec")
    logger.info(f"Failure Injection Rate: {error_rate * 100}%")
    logger.info(f"Max Events Limit: {max_events if max_events > 0 else 'Unlimited'}")

    try:
        producer = KafkaTransactionProducer(topic=topic)
        generator = TransactionGenerator(error_rate=error_rate)
    except Exception as e:
        logger.error(f"Failed to initialize producer/generator: {e}")
        sys.exit(1)

    sleep_time = 1.0 / events_per_second if events_per_second > 0 else 0
    events_generated_count = 0
    last_log_time = time.time()

    logger.info("Kafka connected. Starting generation loop...")

    try:
        while running:
            # Generate event
            event = generator.generate_event()
            
            # Produce to Kafka
            producer.produce(event)
            events_generated_count += 1
            
            # Log periodic throughput (every 5 seconds)
            current_time = time.time()
            if current_time - last_log_time >= 5.0:
                delivered = producer.metrics["delivered"]
                failures = producer.metrics["failures"]
                logger.info(f"Metrics - Generated: {events_generated_count} | Delivered: {delivered} | Failures: {failures}")
                last_log_time = current_time
                
            # Check hard limit
            if 0 < max_events <= events_generated_count:
                logger.info(f"Reached MAX_EVENTS limit ({max_events}). Stopping generation.")
                break
                
            # Throttle to meet events_per_second
            if sleep_time > 0:
                time.sleep(sleep_time)

    except Exception as e:
        logger.error(f"Unexpected error in generation loop: {e}")
    finally:
        # Graceful shutdown
        logger.info("Closing producer...")
        producer.close()
        
        # Final Metrics
        logger.info("=== FINAL PRODUCER METRICS ===")
        logger.info(f"Events Generated: {events_generated_count}")
        logger.info(f"Events Attempted: {producer.metrics['attempted']}")
        logger.info(f"Events Delivered: {producer.metrics['delivered']}")
        logger.info(f"Delivery Failures: {producer.metrics['failures']}")
        logger.info(f"Intentional Data Errors Injected: {generator.metrics['errors_injected']}")
        logger.info("Producer shut down cleanly.")

if __name__ == "__main__":
    main()
