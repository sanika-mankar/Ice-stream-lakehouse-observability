import os
import sys
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

load_dotenv()

from app.ingestion.producer import KafkaTransactionProducer

def generate_controlled_batch():
    print("=== Generating Controlled Batch for Master 5 End-to-End Test ===")
    
    topic = os.getenv("KAFKA_TOPIC_TRANSACTIONS", "ice-stream.transactions")
    producer = KafkaTransactionProducer(topic=topic)

    valid_events = []
    invalid_events = []

    # 1. Generate 25 valid transactions
    for i in range(1, 26):
        now_str = datetime.now(timezone.utc).isoformat()
        evt = {
            "event_id": f"evt-valid-{i:03d}-{uuid.uuid4().hex[:6]}",
            "transaction_id": f"tx-val-{i:03d}",
            "event_time": now_str,
            "customer_id": f"cust-{100 + i}",
            "product_id": f"prod-{200 + (i % 5)}",
            "quantity": (i % 4) + 1,
            "unit_price": round(19.99 + (i * 2.5), 2),
            "currency": "USD",
            "status": "COMPLETED" if i % 2 == 0 else "PENDING",
            "payment_method": "CREDIT_CARD" if i % 2 == 0 else "DEBIT_CARD",
            "source": "pos",
            "schema_version": "1.0",
            "metadata": {"test_batch": "master_5", "item_num": i}
        }
        valid_events.append(evt)

    # 2. Generate 5 invalid transactions
    now_str = datetime.now(timezone.utc).isoformat()
    # Invalid 1: Missing customer_id (DQ-001)
    inv1 = {
        "event_id": f"evt-inv-001-{uuid.uuid4().hex[:6]}",
        "transaction_id": "tx-inv-001",
        "event_time": now_str,
        "customer_id": None,
        "product_id": "prod-999",
        "quantity": 1,
        "unit_price": 50.00,
        "currency": "USD",
        "status": "COMPLETED",
        "payment_method": "CREDIT_CARD",
        "source": "pos",
        "schema_version": "1.0"
    }
    # Invalid 2: Bad quantity type (DQ-002)
    inv2 = {
        "event_id": f"evt-inv-002-{uuid.uuid4().hex[:6]}",
        "transaction_id": "tx-inv-002",
        "event_time": now_str,
        "customer_id": "cust-999",
        "product_id": "prod-999",
        "quantity": "three",
        "unit_price": 10.00,
        "currency": "USD",
        "status": "COMPLETED",
        "payment_method": "CREDIT_CARD",
        "source": "pos",
        "schema_version": "1.0"
    }
    # Invalid 3: Negative price (DQ-004)
    inv3 = {
        "event_id": f"evt-inv-003-{uuid.uuid4().hex[:6]}",
        "transaction_id": "tx-inv-003",
        "event_time": now_str,
        "customer_id": "cust-999",
        "product_id": "prod-999",
        "quantity": 2,
        "unit_price": -45.00,
        "currency": "USD",
        "status": "COMPLETED",
        "payment_method": "CREDIT_CARD",
        "source": "pos",
        "schema_version": "1.0"
    }
    # Invalid 4: Unknown status (DQ-005)
    inv4 = {
        "event_id": f"evt-inv-004-{uuid.uuid4().hex[:6]}",
        "transaction_id": "tx-inv-004",
        "event_time": now_str,
        "customer_id": "cust-999",
        "product_id": "prod-999",
        "quantity": 1,
        "unit_price": 25.00,
        "currency": "USD",
        "status": "DELIVERED",
        "payment_method": "CREDIT_CARD",
        "source": "pos",
        "schema_version": "1.0"
    }
    # Invalid 5: Duplicate of valid_events[0] (DQ-006)
    inv5 = dict(valid_events[0])

    invalid_events = [inv1, inv2, inv3, inv4, inv5]

    print(f"Sending 25 valid events to Kafka...")
    for evt in valid_events:
        producer.produce(evt)

    print(f"Sending 5 invalid events to Kafka...")
    for evt in invalid_events:
        producer.produce(evt)

    producer.close()
    
    print("\n--- Summary of Controlled Batch ---")
    print(f"Total Sent:     30")
    print(f"Valid Expected: 25 -> Should land in ice_stream.transactions_clean")
    print(f"Invalid Expected: 5 -> Should land in ice_stream.transactions_dlq")
    print("=" * 60)

if __name__ == "__main__":
    generate_controlled_batch()
