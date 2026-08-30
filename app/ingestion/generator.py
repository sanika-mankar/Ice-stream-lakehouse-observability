"""Transaction event generator.

Simulates an e-commerce stream by generating random transactions.
Supports configurable error rates for validation testing.
"""

import random
import uuid
from collections.abc import Iterator
from datetime import UTC
from typing import Any

from faker import Faker

from app.domain.transaction import Transaction


class TransactionGenerator:
    """Generates synthetic e-commerce transactions."""

    def __init__(
        self,
        seed: int | None = None,
        error_rate: float = 0.0,
        source_name: str = "web_store",
        schema_version: str = "1.0",
    ) -> None:
        """Initialize the generator.

        Args:
            seed: Random seed for deterministic generation
            error_rate: Probability (0.0 to 1.0) of generating an invalid event
            source_name: The source string to attach to events
            schema_version: The schema version string to attach to events
        """
        self.faker = Faker()
        self.random = random.Random()
        if seed is not None:
            self.faker.seed_instance(seed)
            self.random.seed(seed)

        self.error_rate = error_rate
        self.source_name = source_name
        self.schema_version = schema_version
        
        self.metrics = {
            "generated": 0,
            "errors_injected": 0,
            "error_types": {
                "missing_field": 0,
                "negative_price": 0,
                "invalid_status": 0,
                "invalid_type": 0
            }
        }

        self.products = [
            ("PROD-001", "Laptop", 1200.00),
            ("PROD-002", "Smartphone", 800.00),
            ("PROD-003", "Headphones", 150.00),
            ("PROD-004", "Monitor", 300.00),
            ("PROD-005", "Keyboard", 100.00),
            ("PROD-006", "Mouse", 50.00),
            ("PROD-007", "Tablet", 600.00),
            ("PROD-008", "Smartwatch", 250.00),
        ]

        self.currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"]
        self.payment_methods = ["CREDIT_CARD", "PAYPAL", "APPLE_PAY", "GOOGLE_PAY", "BANK_TRANSFER"]
        self.statuses = ["COMPLETED", "PENDING", "FAILED", "REFUNDED"]

    def _generate_valid_dict(self) -> dict[str, Any]:
        """Generate a valid transaction dictionary."""
        product_id, _, base_price = self.random.choice(self.products)
        quantity = self.random.randint(1, 5)

        # Slight price variations
        price_multiplier = self.random.uniform(0.9, 1.1)
        unit_price = round(base_price * price_multiplier, 2)

        return {
            "event_id": str(uuid.UUID(int=self.random.getrandbits(128))),
            "event_time": self.faker.date_time_this_year(tzinfo=UTC).isoformat(),
            "transaction_id": f"TXN-{self.random.randint(1000000, 9999999)}",
            "customer_id": f"CUST-{self.random.randint(10000, 99999)}",
            "product_id": product_id,
            "quantity": quantity,
            "unit_price": unit_price,
            "currency": self.random.choice(self.currencies),
            "payment_method": self.random.choice(self.payment_methods),
            "status": self.random.choice(self.statuses),
            "source": self.source_name,
            "schema_version": self.schema_version,
            "metadata": {
                "ip_address": self.faker.ipv4(),
                "user_agent": self.faker.user_agent(),
            },
        }

    def _inject_error(self, data: dict[str, Any]) -> dict[str, Any]:
        """Inject an error into the transaction data."""
        error_type = self.random.choice(
            ["missing_field", "negative_price", "invalid_status", "invalid_type"]
        )

        if error_type == "missing_field":
            field_to_remove = self.random.choice(
                ["customer_id", "product_id", "currency", "payment_method"]
            )
            if field_to_remove in data:
                del data[field_to_remove]

        elif error_type == "negative_price":
            data["unit_price"] = -abs(data["unit_price"])

        elif error_type == "invalid_status":
            data["status"] = "UNKNOWN_STATUS"

        elif error_type == "invalid_type":
            # Set a string where an int is expected
            data["quantity"] = "three"

        self.metrics["errors_injected"] += 1
        self.metrics["error_types"][error_type] += 1

        return data

    def generate_event(self) -> dict[str, Any]:
        """Generate a single event dictionary.

        Returns:
            Dictionary representing a valid or invalid transaction
        """
        data = self._generate_valid_dict()

        if self.random.random() < self.error_rate:
            data = self._inject_error(data)

        self.metrics["generated"] += 1

        return data

    def generate_events(self, count: int) -> Iterator[dict[str, Any]]:
        """Generate a stream of events.

        Args:
            count: Number of events to generate

        Yields:
            Transaction dictionaries
        """
        for _ in range(count):
            yield self.generate_event()

    def generate_transactions(self, count: int) -> Iterator[Transaction]:
        """Generate valid Transaction objects.

        Warning: This will raise exceptions if the generated events are invalid.
        It is recommended to only use this when error_rate = 0.

        Args:
            count: Number of events to generate

        Yields:
            Transaction objects
        """
        for data in self.generate_events(count):
            yield Transaction.from_dict(data)
