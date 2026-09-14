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
    print("=== Generating Controlled Batch for Master 5 DQ-001..DQ-008 Verification ===")

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
            "metadata": {"test_batch": "master_5_full_dq", "item_num": i},
        }
        valid_events.append(evt)

    # 2. Generate 8 targeted invalid transactions covering DQ-001 through DQ-008
    now_str = datetime.now(timezone.utc).isoformat()

    # Rule DQ-001: REQUIRED_FIELD_MISSING (customer_id key completely absent)
    inv1 = {
        "event_id": f"evt-inv-dq001-{uuid.uuid4().hex[:6]}",
        "transaction_id": "tx-inv-dq001",
        "event_time": now_str,
        # 'customer_id' is missing
        "product_id": "prod-999",
        "quantity": 1,
        "unit_price": 50.00,
        "currency": "USD",
        "status": "COMPLETED",
        "payment_method": "CREDIT_CARD",
        "source": "pos",
        "schema_version": "1.0",
    }

    # Rule DQ-002: NULL_REQUIRED_FIELD (customer_id key present but None)
    inv2 = {
        "event_id": f"evt-inv-dq002-{uuid.uuid4().hex[:6]}",
        "transaction_id": "tx-inv-dq002",
        "event_time": now_str,
        "customer_id": None,
        "product_id": "prod-999",
        "quantity": 1,
        "unit_price": 50.00,
        "currency": "USD",
        "status": "COMPLETED",
        "payment_method": "CREDIT_CARD",
        "source": "pos",
        "schema_version": "1.0",
    }

    # Rule DQ-003: INVALID_TYPE (quantity is string 'three')
    inv3 = {
        "event_id": f"evt-inv-dq003-{uuid.uuid4().hex[:6]}",
        "transaction_id": "tx-inv-dq003",
        "event_time": now_str,
        "customer_id": "cust-999",
        "product_id": "prod-999",
        "quantity": "three",
        "unit_price": 10.00,
        "currency": "USD",
        "status": "COMPLETED",
        "payment_method": "CREDIT_CARD",
        "source": "pos",
        "schema_version": "1.0",
    }

    # Rule DQ-004: INVALID_RANGE (unit_price is negative)
    inv4 = {
        "event_id": f"evt-inv-dq004-{uuid.uuid4().hex[:6]}",
        "transaction_id": "tx-inv-dq004",
        "event_time": now_str,
        "customer_id": "cust-999",
        "product_id": "prod-999",
        "quantity": 2,
        "unit_price": -45.00,
        "currency": "USD",
        "status": "COMPLETED",
        "payment_method": "CREDIT_CARD",
        "source": "pos",
        "schema_version": "1.0",
    }

    # Rule DQ-005: INVALID_ENUM (status 'DELIVERED' is not in allowed enum)
    inv5 = {
        "event_id": f"evt-inv-dq005-{uuid.uuid4().hex[:6]}",
        "transaction_id": "tx-inv-dq005",
        "event_time": now_str,
        "customer_id": "cust-999",
        "product_id": "prod-999",
        "quantity": 1,
        "unit_price": 25.00,
        "currency": "USD",
        "status": "DELIVERED",
        "payment_method": "CREDIT_CARD",
        "source": "pos",
        "schema_version": "1.0",
    }

    # Rule DQ-006: DUPLICATE_EVENT (replay valid_events[0])
    inv6 = dict(valid_events[0])

    # Rule DQ-007: SCHEMA_MISMATCH (unauthorized extra drift field)
    inv7 = {
        "event_id": f"evt-inv-dq007-{uuid.uuid4().hex[:6]}",
        "transaction_id": "tx-inv-dq007",
        "event_time": now_str,
        "customer_id": "cust-999",
        "product_id": "prod-999",
        "quantity": 1,
        "unit_price": 30.00,
        "currency": "USD",
        "status": "COMPLETED",
        "payment_method": "CREDIT_CARD",
        "source": "pos",
        "schema_version": "1.0",
        "unauthorized_drift_field": "malicious_or_unexpected",
    }

    # Rule DQ-008: UNKNOWN_SCHEMA_VERSION (schema_version '99.0' unsupported)
    inv8 = {
        "event_id": f"evt-inv-dq008-{uuid.uuid4().hex[:6]}",
        "transaction_id": "tx-inv-dq008",
        "event_time": now_str,
        "customer_id": "cust-999",
        "product_id": "prod-999",
        "quantity": 1,
        "unit_price": 20.00,
        "currency": "USD",
        "status": "COMPLETED",
        "payment_method": "CREDIT_CARD",
        "source": "pos",
        "schema_version": "99.0",
    }

    invalid_events = [inv1, inv2, inv3, inv4, inv5, inv6, inv7, inv8]

    print(f"Sending 25 valid events to Kafka topic '{topic}'...")
    for evt in valid_events:
        producer.produce(evt)

    print(f"Sending 8 invalid events (DQ-001..DQ-008) to Kafka topic '{topic}'...")
    for evt in invalid_events:
        producer.produce(evt)

    producer.close()

    # Also bridge with running FastAPI dashboard if available
    try:
        import urllib.request
        all_events = valid_events + invalid_events
        data = json.dumps({"events": all_events}).encode("utf-8")
        req = urllib.request.Request(
            "http://127.0.0.1:8000/api/ingest",
            data=data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=3) as resp:
            if resp.status == 200:
                print("  -> Synced batch with live FastAPI Observability Dashboard (/api/ingest)!")
    except Exception as e:
        print(f"  (Note: FastAPI bridge skipped or offline: {e})")

    print("\n--- Summary of Controlled Batch ---")
    print(f"Total Sent:       33")
    print(f"Valid Expected:   25 -> Routes to transactions_clean")
    print(f"Invalid Expected:  8 -> Routes to transactions_dlq (DQ-001..DQ-008)")
    print("  - DQ-001: Missing required field (customer_id omitted)")
    print("  - DQ-002: NULL required field (customer_id is None)")
    print("  - DQ-003: Invalid type (quantity='three')")
    print("  - DQ-004: Invalid range (unit_price=-45.00)")
    print("  - DQ-005: Invalid enum (status='DELIVERED')")
    print("  - DQ-006: Duplicate event (replayed valid_events[0])")
    print("  - DQ-007: Schema mismatch (extra unauthorized attribute)")
    print("  - DQ-008: Unknown schema version (schema_version='99.0')")
    print("=" * 60)


if __name__ == "__main__":
    generate_controlled_batch()
