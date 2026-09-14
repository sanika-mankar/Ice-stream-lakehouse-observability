"""Business logic validation rules (DQ-004, DQ-005).

Checks for value range violations and invalid enumeration values.
"""

from typing import Any

from app.domain.validation import ValidationResult
from app.validation.registry import Validator


class RangeValidator(Validator):
    """Validates numeric ranges: quantity > 0, unit_price >= 0 (DQ-004)."""

    @property
    def rule_id(self) -> str:
        return "DQ-004"

    @property
    def description(self) -> str:
        return "Numeric values must be within acceptable ranges (INVALID_RANGE)."

    def validate(self, data: dict[str, Any], result: ValidationResult) -> None:
        # Validate unit_price >= 0
        unit_price = data.get("unit_price")
        if unit_price is not None and isinstance(unit_price, (int, float)) and not isinstance(unit_price, bool):
            if unit_price < 0:
                result.add_error(
                    message=f"Negative unit_price not allowed: {unit_price} (DQ-004)",
                    rule_id=self.rule_id,
                )

        # Validate quantity > 0
        quantity = data.get("quantity")
        if quantity is not None and isinstance(quantity, int) and not isinstance(quantity, bool):
            if quantity <= 0:
                result.add_error(
                    message=f"Quantity must be greater than zero, got: {quantity} (DQ-004)",
                    rule_id=self.rule_id,
                )


class PositivePriceValidator(RangeValidator):
    """Backward-compatible alias for RangeValidator."""
    pass


class EnumValidator(Validator):
    """Validates that status, currency, and payment_method are recognized values (DQ-005)."""

    ALLOWED_STATUSES = {"COMPLETED", "PENDING", "FAILED", "REFUNDED"}
    ALLOWED_CURRENCIES = {"USD", "EUR", "GBP", "INR", "AUD", "CAD", "JPY", "CNY"}
    ALLOWED_PAYMENT_METHODS = {
        "CREDIT_CARD", "DEBIT_CARD", "UPI", "CARD", "NETBANKING",
        "WALLET", "PAYPAL", "APPLEPAY", "APPLE_PAY", "GOOGLE_PAY", "BANK_TRANSFER"
    }

    @property
    def rule_id(self) -> str:
        return "DQ-005"

    @property
    def description(self) -> str:
        return "Status, currency, and payment method must be recognized enumeration values (INVALID_ENUM)."

    def validate(self, data: dict[str, Any], result: ValidationResult) -> None:
        status = data.get("status")
        if status is not None and isinstance(status, str):
            if status.upper() not in self.ALLOWED_STATUSES:
                result.add_error(
                    message=f"Invalid status '{status}'. Must be one of: {', '.join(sorted(self.ALLOWED_STATUSES))} (DQ-005)",
                    rule_id=self.rule_id,
                )

        currency = data.get("currency")
        if currency is not None and isinstance(currency, str):
            if currency.upper() not in self.ALLOWED_CURRENCIES:
                result.add_error(
                    message=f"Invalid currency '{currency}'. Must be one of: {', '.join(sorted(self.ALLOWED_CURRENCIES))} (DQ-005)",
                    rule_id=self.rule_id,
                )

        payment_method = data.get("payment_method")
        if payment_method is not None and isinstance(payment_method, str):
            if payment_method.upper() not in self.ALLOWED_PAYMENT_METHODS:
                result.add_error(
                    message=f"Invalid payment_method '{payment_method}'. Must be one of: {', '.join(sorted(self.ALLOWED_PAYMENT_METHODS))} (DQ-005)",
                    rule_id=self.rule_id,
                )


class ValidStatusValidator(EnumValidator):
    """Backward-compatible alias for EnumValidator."""
    pass
