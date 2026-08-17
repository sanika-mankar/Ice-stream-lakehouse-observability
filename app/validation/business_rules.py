"""Business logic validation rules.

Checks for violations of business constraints like negative prices or invalid statuses.
"""

from typing import Any

from app.domain.validation import ValidationResult
from app.validation.registry import Validator


class PositivePriceValidator(Validator):
    """Validates that unit price is non-negative."""

    @property
    def rule_id(self) -> str:
        return "DQ-003"

    @property
    def description(self) -> str:
        return "Unit price must be non-negative."

    def validate(self, data: dict[str, Any], result: ValidationResult) -> None:
        unit_price = data.get("unit_price")
        
        if unit_price is None:
            return  # Handled by RequiredFieldsValidator
            
        try:
            price_val = float(unit_price)
            if price_val < 0:
                result.add_error(
                    message=f"Negative unit_price not allowed: {price_val}",
                    rule_id=self.rule_id,
                )
        except (ValueError, TypeError):
            pass  # Handled by TypeValidator


class ValidStatusValidator(Validator):
    """Validates that status is one of the approved values."""

    @property
    def rule_id(self) -> str:
        return "DQ-004"

    @property
    def description(self) -> str:
        return "Status must be a recognized business state."

    def validate(self, data: dict[str, Any], result: ValidationResult) -> None:
        status = data.get("status")
        
        if not status:
            return  # Handled by RequiredFieldsValidator
            
        valid_statuses = {"COMPLETED", "PENDING", "FAILED", "REFUNDED"}
        
        if status not in valid_statuses:
            result.add_error(
                message=f"Invalid status '{status}'. Must be one of: {', '.join(valid_statuses)}",
                rule_id=self.rule_id,
            )
