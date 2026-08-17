"""Transaction domain model.

Represents an e-commerce transaction in the Ice Stream system.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class Transaction:
    """Represents a single e-commerce transaction.

    This is the canonical data model for transactions flowing through
    Ice Stream. All fields are immutable after creation.

    Attributes:
        event_id: Unique identifier for this event
        event_time: When the transaction occurred (UTC)
        transaction_id: Unique identifier for the transaction
        customer_id: Customer identifier
        product_id: Product identifier
        quantity: Number of units purchased
        unit_price: Price per unit
        currency: Currency code (ISO 4217)
        payment_method: How the payment was made
        status: Current transaction status
        source: System that originated the transaction
        schema_version: Version of the data contract
    """

    # Core event metadata
    event_id: str
    event_time: datetime
    source: str
    schema_version: str

    # Transaction details
    transaction_id: str
    customer_id: str
    product_id: str
    quantity: int
    unit_price: float
    currency: str

    # Transaction state
    status: str
    payment_method: str

    # Additional context
    metadata: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        """Validate basic constraints after initialization."""
        if not self.event_id:
            raise ValueError("event_id cannot be empty")
        if not self.transaction_id:
            raise ValueError("transaction_id cannot be empty")
        if not self.customer_id:
            raise ValueError("customer_id cannot be empty")
        if not self.product_id:
            raise ValueError("product_id cannot be empty")
        if self.quantity is None:
            raise ValueError("quantity cannot be None")
        if self.unit_price is None:
            raise ValueError("unit_price cannot be None")
        if not self.currency:
            raise ValueError("currency cannot be empty")
        if not self.status:
            raise ValueError("status cannot be empty")

    def to_dict(self) -> dict[str, Any]:
        """Convert transaction to dictionary.

        Returns:
            Dictionary representation of the transaction
        """
        return {
            "event_id": self.event_id,
            "event_time": self.event_time.isoformat(),
            "transaction_id": self.transaction_id,
            "customer_id": self.customer_id,
            "product_id": self.product_id,
            "quantity": self.quantity,
            "unit_price": self.unit_price,
            "currency": self.currency,
            "payment_method": self.payment_method,
            "status": self.status,
            "source": self.source,
            "schema_version": self.schema_version,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Transaction":
        """Create a transaction from a dictionary.

        Args:
            data: Dictionary with transaction fields

        Returns:
            Transaction instance

        Raises:
            ValueError: If required fields are missing or invalid
            TypeError: If field types are incorrect
        """
        try:
            # Parse event_time if it's a string
            event_time = data.get("event_time")
            if isinstance(event_time, str):
                event_time = datetime.fromisoformat(event_time.replace("Z", "+00:00"))

            return cls(
                event_id=data["event_id"],
                event_time=event_time,
                source=data["source"],
                schema_version=data["schema_version"],
                transaction_id=data["transaction_id"],
                customer_id=data["customer_id"],
                product_id=data["product_id"],
                quantity=int(data["quantity"]),
                unit_price=float(data["unit_price"]),
                currency=data["currency"],
                payment_method=data["payment_method"],
                status=data["status"],
                metadata=data.get("metadata", {}),
            )
        except KeyError as e:
            raise ValueError(f"Missing required field: {e}") from e
        except (TypeError, ValueError) as e:
            raise TypeError(f"Invalid field type: {e}") from e
