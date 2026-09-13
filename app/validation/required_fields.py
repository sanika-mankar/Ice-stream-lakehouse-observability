"""Required fields validation (DQ-001, DQ-002).

Ensures that all mandatory fields are present and non-null in the incoming event.
"""

from typing import Any

from app.domain.validation import ValidationResult
from app.validation.registry import Validator

CANONICAL_REQUIRED_FIELDS = [
    "event_id",
    "transaction_id",
    "customer_id",
    "product_id",
    "quantity",
    "unit_price",
    "currency",
    "status",
]


class RequiredFieldsValidator(Validator):
    """Validates that all required fields are present in the event payload."""

    @property
    def rule_id(self) -> str:
        return "DQ-001"

    @property
    def description(self) -> str:
        return "All required fields must be present (REQUIRED_FIELD_MISSING)."

    def validate(self, data: dict[str, Any], result: ValidationResult) -> None:
        missing = [field for field in CANONICAL_REQUIRED_FIELDS if field not in data]
        if missing:
            result.add_error(
                message=f"Missing required fields: {', '.join(missing)} (DQ-001)",
                rule_id=self.rule_id,
            )


class NullRequiredFieldValidator(Validator):
    """Validates that required fields do not contain NULL values."""

    @property
    def rule_id(self) -> str:
        return "DQ-002"

    @property
    def description(self) -> str:
        return "No required field can have a NULL value (NULL_REQUIRED_FIELD)."

    def validate(self, data: dict[str, Any], result: ValidationResult) -> None:
        null_fields = [
            field for field in CANONICAL_REQUIRED_FIELDS
            if field in data and data[field] is None
        ]
        if null_fields:
            result.add_error(
                message=f"Required fields cannot be NULL: {', '.join(null_fields)} (DQ-002)",
                rule_id=self.rule_id,
            )
