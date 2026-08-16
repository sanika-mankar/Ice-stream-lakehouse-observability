"""Unit tests for Transaction domain model."""

from datetime import datetime

import pytest

from app.domain.transaction import Transaction


def test_create_valid_transaction() -> None:
    """Test creating a valid transaction."""
    txn = Transaction(
        event_id="evt_001",
        event_time=datetime(2026, 8, 16, 14, 30, 21),
        source="checkout-service",
        schema_version="1.0",
        transaction_id="txn_001",
        customer_id="cus_001",
        product_id="prod_001",
        quantity=2,
        unit_price=100.0,
        currency="INR",
        status="completed",
        payment_method="UPI",
    )

    assert txn.event_id == "evt_001"
    assert txn.quantity == 2
    assert txn.unit_price == 100.0
    assert txn.currency == "INR"


def test_transaction_to_dict() -> None:
    """Test converting transaction to dictionary."""
    txn = Transaction(
        event_id="evt_001",
        event_time=datetime(2026, 8, 16, 14, 30, 21),
        source="checkout-service",
        schema_version="1.0",
        transaction_id="txn_001",
        customer_id="cus_001",
        product_id="prod_001",
        quantity=1,
        unit_price=50.0,
        currency="USD",
        status="pending",
        payment_method="Card",
    )

    result = txn.to_dict()

    assert result["event_id"] == "evt_001"
    assert result["quantity"] == 1
    assert result["currency"] == "USD"


def test_transaction_from_dict() -> None:
    """Test creating transaction from dictionary."""
    data = {
        "event_id": "evt_001",
        "event_time": "2026-08-16T14:30:21",
        "source": "checkout-service",
        "schema_version": "1.0",
        "transaction_id": "txn_001",
        "customer_id": "cus_001",
        "product_id": "prod_001",
        "quantity": 1,
        "unit_price": 75.0,
        "currency": "EUR",
        "status": "completed",
        "payment_method": "Card",
    }

    txn = Transaction.from_dict(data)

    assert txn.event_id == "evt_001"
    assert txn.currency == "EUR"
    assert txn.unit_price == 75.0


def test_transaction_missing_required_field() -> None:
    """Test that creating transaction with missing field raises error."""
    with pytest.raises(ValueError):
        Transaction.from_dict(
            {
                "event_id": "evt_001",
                "event_time": "2026-08-16T14:30:21",
                # Missing other fields
            }
        )


def test_transaction_empty_event_id() -> None:
    """Test that transaction with empty event_id raises error."""
    with pytest.raises(ValueError, match="event_id cannot be empty"):
        Transaction(
            event_id="",
            event_time=datetime.now(),
            source="test",
            schema_version="1.0",
            transaction_id="txn_001",
            customer_id="cus_001",
            product_id="prod_001",
            quantity=1,
            unit_price=100.0,
            currency="INR",
            status="completed",
            payment_method="UPI",
        )


def test_transaction_none_quantity() -> None:
    """Test that transaction with None quantity raises error."""
    with pytest.raises(ValueError, match="quantity cannot be None"):
        Transaction(
            event_id="evt_001",
            event_time=datetime.now(),
            source="test",
            schema_version="1.0",
            transaction_id="txn_001",
            customer_id="cus_001",
            product_id="prod_001",
            quantity=None,  # type: ignore
            unit_price=100.0,
            currency="INR",
            status="completed",
            payment_method="UPI",
        )
