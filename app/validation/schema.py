"""Schema validation rules (DQ-007, DQ-008).

Ensures event conforms to schema v1.0 and does not contain unauthorized fields.
"""

from typing import Any

from app.domain.validation import ValidationResult
from app.validation.registry import Validator

ALLOWED_SCHEMA_FIELDS = {
    "event_id",
    "transaction_id",
    "event_time",
    "customer_id",
    "product_id",
    "quantity",
    "unit_price",
    "currency",
    "status",
    "payment_method",
    "source",
    "schema_version",
    "metadata",
}


class SchemaMismatchValidator(Validator):
    """Validates that payload contains only allowed canonical schema fields (DQ-007)."""

    @property
    def rule_id(self) -> str:
        return "DQ-007"

    @property
    def description(self) -> str:
        return "Event structure must match schema v1.0 with no unauthorized fields (SCHEMA_MISMATCH)."

    def validate(self, data: dict[str, Any], result: ValidationResult) -> None:
        extra_fields = set(data.keys()) - ALLOWED_SCHEMA_FIELDS
        if extra_fields:
            result.add_error(
                message=f"Schema mismatch: unauthorized extra fields: {', '.join(sorted(extra_fields))} (DQ-007)",
                rule_id=self.rule_id,
            )


class SchemaVersionValidator(Validator):
    """Validates that schema_version is present and supported (DQ-008)."""

    SUPPORTED_VERSIONS = {"1.0"}

    @property
    def rule_id(self) -> str:
        return "DQ-008"

    @property
    def description(self) -> str:
        return "Specified schema version must be supported (UNKNOWN_SCHEMA_VERSION)."

    def validate(self, data: dict[str, Any], result: ValidationResult) -> None:
        version = data.get("schema_version")
        if not version:
            result.add_error(
                message="Missing schema_version (DQ-008)",
                rule_id=self.rule_id,
            )
        elif str(version) not in self.SUPPORTED_VERSIONS:
            result.add_error(
                message=f"Unknown schema_version '{version}'. Supported: {', '.join(self.SUPPORTED_VERSIONS)} (DQ-008)",
                rule_id=self.rule_id,
            )
