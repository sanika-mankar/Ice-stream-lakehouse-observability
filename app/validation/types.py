"""Type validation rules.

Ensures that fields have the correct data types.
"""

from typing import Any

from app.domain.validation import ValidationResult
from app.validation.registry import Validator


class TypeValidator(Validator):
    """Validates that fields have the expected data types."""

    @property
    def rule_id(self) -> str:
        return "DQ-002"

    @property
    def description(self) -> str:
        return "Fields must have the correct data types."

    def validate(self, data: dict[str, Any], result: ValidationResult) -> None:
        # We only validate types for fields that are present
        
        quantity = data.get("quantity")
        if quantity is not None and not isinstance(quantity, int):
            # Try to cast if it's a string, e.g. "1" but not "three"
            if isinstance(quantity, str):
                try:
                    int(quantity)
                except ValueError:
                    result.add_error(
                        message=f"Field 'quantity' must be an integer, got {type(quantity).__name__}",
                        rule_id=self.rule_id,
                    )
            else:
                result.add_error(
                    message=f"Field 'quantity' must be an integer, got {type(quantity).__name__}",
                    rule_id=self.rule_id,
                )

        unit_price = data.get("unit_price")
        if unit_price is not None and not isinstance(unit_price, (int, float)):
            if isinstance(unit_price, str):
                try:
                    float(unit_price)
                except ValueError:
                    result.add_error(
                        message=f"Field 'unit_price' must be numeric, got {type(unit_price).__name__}",
                        rule_id=self.rule_id,
                    )
            else:
                result.add_error(
                    message=f"Field 'unit_price' must be numeric, got {type(unit_price).__name__}",
                    rule_id=self.rule_id,
                )
