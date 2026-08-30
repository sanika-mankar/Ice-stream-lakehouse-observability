# Master 3: Kafka Streaming Pipeline

## Architecture Overview
This phase introduces the **Real Python -> Kafka Streaming Layer**. 
The Python transaction generator has been integrated with a real Kafka Producer to push synthetic e-commerce events to a real Aiven Apache Kafka cluster.

**Data Flow:**
`Python Event Generator` -> `Python Kafka Producer` -> `REAL AIVEN KAFKA` -> `ice-stream.transactions`

## Components

### 1. Python Event Generator (`app.ingestion.generator`)
The `TransactionGenerator` generates synthetic, realistic e-commerce transactions using `Faker`. 
- Generates data that follows the canonical `Transaction` domain schema.
- Includes a configurable failure injection mechanism. 

### 2. Kafka Producer (`app.ingestion.producer`)
The `KafkaTransactionProducer` securely connects to the Aiven Kafka cluster using SSL and SASL_SCRAM/PLAIN authentication.
- Produces events deterministically with the `transaction_id` as the message key.
- Includes a delivery callback mechanism to confirm delivery and handle failures gracefully.
- Maintains producer-side metrics: attempted, delivered, and failed.

## Event Schema
The canonical event schema represents a single e-commerce transaction, mapped to `app.domain.transaction.Transaction`:

- `event_id`: Unique identifier for the event
- `event_time`: UTC timestamp of the event
- `source`: Source identifier
- `schema_version`: Schema version (e.g., "1.0")
- `transaction_id`: Unique transaction identifier
- `customer_id`: Unique customer identifier
- `product_id`: Product SKU or identifier
- `quantity`: Number of items
- `unit_price`: Price per item
- `currency`: Currency code (e.g., USD)
- `payment_method`: Method of payment
- `status`: Transaction status (e.g., COMPLETED, PENDING, FAILED, REFUNDED)

## Message Key
The Kafka producer uses `transaction_id` as the message key. 
**Reasoning**: Using the `transaction_id` ensures that events related to the same transaction are deterministically partitioned and streamed in order, enabling accurate stateful stream processing later in the pipeline.

## Serialization
Events are serialized to standard JSON and encoded to UTF-8 before being published to Kafka.

## Failure Injection
The generator can intentionally create invalid transactions (bad data) to test the downstream Quality Engine. The failure types currently supported:
- `missing_field`: Randomly removes a required field (e.g., `customer_id`)
- `negative_price`: Flips `unit_price` to a negative value
- `invalid_status`: Sets `status` to an unknown value
- `invalid_type`: Assigns a string to `quantity` instead of an integer

Failure injection is controlled by the `EVENT_FAILURE_RATE` environment variable (e.g., 0.05 for 5% failures).

## Configuration
The following environment variables control the pipeline (found in `.env`):
- `KAFKA_BOOTSTRAP_SERVERS`: URL to the Kafka brokers.
- `KAFKA_SECURITY_PROTOCOL`: Usually SASL_SSL.
- `KAFKA_SASL_MECHANISMS`: Usually PLAIN or SCRAM-SHA-256.
- `KAFKA_SASL_USERNAME`: The Kafka credentials username.
- `KAFKA_SASL_PASSWORD`: The Kafka credentials password.
- `KAFKA_TOPIC_TRANSACTIONS`: The Kafka topic (e.g., `ice-stream.transactions`).
- `EVENTS_PER_SECOND`: The rate of event generation (e.g., 10).
- `EVENT_FAILURE_RATE`: Probability of generating an invalid event (e.g., 0.05).
- `MAX_EVENTS`: The maximum number of events to produce before shutting down (prevents runaway producers).

## Execution and Testing

### Run the Producer
To start the producer in streaming mode, run:
```bash
python scripts/run_producer.py
```
Use `CTRL+C` to gracefully shut down the producer, which will flush pending events before exiting.

### Integration Testing
To run the real Kafka integration test and verify that Python can publish to the actual cluster, run:
```bash
python -m pytest tests/integration/test_kafka_producer.py -v
```

## Troubleshooting
- **Connection Issues**: Ensure `.env` contains valid Aiven Kafka credentials and that the `KAFKA_SECURITY_PROTOCOL` is correctly set.
- **Producer Hanging**: Check if the network allows outgoing connections on the broker's port (usually > 10000 on Aiven).
- **ModuleNotFoundError**: Ensure the virtual environment is activated and `confluent-kafka` is installed.
