"""Pytest configuration and shared fixtures."""

import pytest


@pytest.fixture
def sample_transaction() -> dict:
    """Provide a valid sample transaction for testing.
    
    Returns:
        Dictionary representing a valid transaction
    """
    return {
        "event_id": "evt_test_001",
        "event_time": "2026-08-16T14:30:21Z",
        "transaction_id": "txn_001",
        "customer_id": "cus_001",
        "product_id": "prod_001",
        "quantity": 1,
        "unit_price": 100.0,
        "currency": "INR",
        "payment_method": "UPI",
        "status": "completed",
        "source": "test",
        "schema_version": "1.0",
    }
