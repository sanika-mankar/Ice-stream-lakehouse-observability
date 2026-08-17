"""Tests for the transaction generator."""

from app.domain.transaction import Transaction
from app.ingestion.generator import TransactionGenerator


def test_generator_valid_events():
    """Test generating valid events."""
    generator = TransactionGenerator(error_rate=0.0)

    events = list(generator.generate_events(10))
    assert len(events) == 10

    # Ensure they can all be parsed into Transactions without error
    for event_dict in events:
        txn = Transaction.from_dict(event_dict)
        assert txn.event_id == event_dict["event_id"]
        assert txn.source == "web_store"
        assert txn.schema_version == "1.0"


def test_generator_deterministic_seed():
    """Test that setting a seed produces identical streams."""
    gen1 = TransactionGenerator(seed=42)
    gen2 = TransactionGenerator(seed=42)

    events1 = list(gen1.generate_events(5))
    events2 = list(gen2.generate_events(5))

    assert events1 == events2


def test_generator_error_injection():
    """Test that an error rate of 1.0 produces 100% invalid events."""
    generator = TransactionGenerator(error_rate=1.0)
    events = list(generator.generate_events(50))

    invalid_count = 0
    for event_dict in events:
        has_error = False
        if (
            "customer_id" not in event_dict
            or "product_id" not in event_dict
            or "currency" not in event_dict
            or "payment_method" not in event_dict
        ):
            has_error = True
        elif event_dict.get("unit_price", 0) < 0:
            has_error = True
        elif event_dict.get("status") == "UNKNOWN_STATUS":
            has_error = True
        elif event_dict.get("quantity") == "three":
            has_error = True

        if has_error:
            invalid_count += 1

    # All events should have an injected error
    assert invalid_count == len(events)
