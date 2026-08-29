# MASTER 2: KAFKA SETUP & DEVELOPER EXPERIENCE

This document outlines how to configure, test, and safely run the Ice Stream backend with an external managed Apache Kafka provider (e.g., Confluent Cloud, Upstash, Aiven).

## 1. Where Kafka Credentials are Configured

All Kafka configuration is driven by environment variables to ensure zero secrets are hardcoded in the repository.

1. **Copy the Template:**
   ```bash
   cp .env.example .env
   ```

2. **Configure Provider Details:**
   Open `.env` and fill in the `Kafka Configuration` section with the exact credentials from your Kafka provider:
   ```env
   KAFKA_BOOTSTRAP_SERVERS=your-broker-url:9092
   KAFKA_SECURITY_PROTOCOL=SASL_SSL
   KAFKA_SASL_MECHANISMS=PLAIN
   KAFKA_SASL_USERNAME=your_sasl_username
   KAFKA_SASL_PASSWORD=your_sasl_password
   ```

> [!WARNING]  
> The `.env` file is excluded in `.gitignore`. NEVER commit this file or hardcode credentials in any `.py` files.

## 2. Creating Required Topics

Before testing, you must create the required topics in your managed Kafka dashboard. 

**Topic 1: Transactions**
- **Name:** `ice-stream.transactions`
- **Partitions:** 3 (Recommended for concurrency)
- **Retention:** 7 days

**Topic 2: Dead Letter Queue (DLQ)**
- **Name:** `ice-stream.dlq`
- **Partitions:** 1
- **Retention:** 30 days

*(Note: `ice-stream.alerts` is reserved for future observability events and does not need to be created yet).*

## 3. Testing Kafka Connectivity

A safe connectivity script is provided that tests DNS resolution, authentication, topic availability, and producer permissions by sending exactly one heartbeat message.

**Ensure dependencies are installed:**
```bash
pip install -r requirements.txt
# Ensure confluent-kafka or python-dotenv are installed
pip install confluent-kafka python-dotenv
```

**Run the Test:**
```bash
python scripts/test_kafka_connection.py
```

If successful, you will see `[SUCCESS] Message delivered`. 

## 4. How to Rotate Credentials

If your Kafka credentials leak or require rotation:
1. Revoke the API key / SASL password in your Kafka Provider's Dashboard.
2. Generate a new set of credentials.
3. Update your local `.env` file immediately.
4. Restart any running Ice Stream backend processes to pick up the new variables.

## 5. Running the Application Safely

When we implement the event generator and Flink processors in future phases, they will strictly load credentials via `os.getenv()` or `python-dotenv`. 
As long as you rely on the `.env` file locally or inject Environment Variables safely in your CI/CD and deployment environments (like Docker or Kubernetes secrets), the application is safe to run.
