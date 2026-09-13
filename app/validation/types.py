"""Type validation rules (DQ-003).

Ensures that fields have the correct data types.
"""

from typing import Any

from app.domain.validation import ValidationResult
from app.validation.registry import Validator


class TypeValidator(Validator):
    """Validates that fields have the expected data types."""

    @property
    def rule_id(self) -> str:
        return "DQ-003"

    @property
    def description(self) -> str:
        return "Fields must match their specified type (INVALID_TYPE)."

    def validate(self, data: dict[str, Any], result: ValidationResult) -> None:
        # 1. quantity must be an integer
        quantity = data.get("quantity")
        if quantity is not None:
            if isinstance(quantity, bool):
                result.add_error(
                    message="Field 'quantity' must be an integer, got bool (DQ-003)",
                    rule_id=self.rule_id,
                )
            elif not isinstance(quantity, int):
                result.add_error(
                    message=f"Field 'quantity' must be an integer, got {type(quantity).__name__} (DQ-003)",
                    rule_id=self.rule_id,
                )

        # 2. unit_price must be numeric (int or float)
        unit_price = data.get("unit_price")
        if unit_price is not None:
            if isinstance(unit_price, bool):
                result.add_error(
                    message="Field 'unit_price' must be numeric, got bool (DQ-003)",
                    rule_id=self.rule_id,
                )
            elif not isinstance(unit_price, (int, float)):
                result.add_error(
                    message=f"Field 'unit_price' must be numeric, got {type(unit_price).__name__} (DQ-003)",
                    rule_id=self.rule_id,
                )

        # 3. event_id and transaction_id must be strings if present
        for str_field in ["event_id", "transaction_id", "customer_id", "product_id"]:
            val = data.get(str_field)
            if val is not None and not isinstance(val, str):
                result.add_error(
                    message=f"Field '{str_field}' must be a string, got {type(val).__name__} (DQ-003)",
                    rule_id=self.rule_id,
                )
