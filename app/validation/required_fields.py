"""Required fields validation.

Ensures that all mandatory fields are present in the incoming event.
"""

from typing import Any

from app.domain.validation import ValidationResult
from app.validation.registry import Validator


class RequiredFieldsValidator(Validator):
    """Validates that all required fields are present."""

    @property
    def rule_id(self) -> str:
        return "DQ-001"

    @property
    def description(self) -> str:
        return "All required fields must be present and non-null."

    def validate(self, data: dict[str, Any], result: ValidationResult) -> None:
        required_fields = [
            "event_id",
            "transaction_id",
            "customer_id",
            "product_id",
            "quantity",
            "unit_price",
            "currency",
            "status",
        ]

        missing = []
        for field in required_fields:
            if field not in data or data[field] is None:
                missing.append(field)

        if missing:
            result.add_error(
                message=f"Missing required fields: {', '.join(missing)}",
                rule_id=self.rule_id,
            )
