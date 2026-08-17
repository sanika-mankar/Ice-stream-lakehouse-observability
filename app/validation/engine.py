"""Validation engine.

Orchestrates the execution of all validation rules on incoming events.
"""

from typing import Any

from app.domain.validation import ValidationResult
from app.validation.registry import ValidationRegistry


class ValidationEngine:
    """Engine that runs transactions through a suite of data quality rules."""

    def __init__(self, registry: ValidationRegistry) -> None:
        """Initialize the validation engine.

        Args:
            registry: The registry containing all rules to run
        """
        self.registry = registry

    def validate_event(self, data: dict[str, Any]) -> ValidationResult:
        """Validate an incoming event dictionary.

        Args:
            data: The raw event dictionary

        Returns:
            ValidationResult containing the outcome and any errors
        """
        validators = self.registry.get_all()
        
        # Initialize result
        result = ValidationResult(
            is_valid=True,
            rule_ids=[v.rule_id for v in validators],
        )

        # Run all validators
        for validator in validators:
            # We catch exceptions to ensure one bad validator doesn't crash the engine
            try:
                validator.validate(data, result)
            except Exception as e:
                result.add_error(
                    message=f"Validator crashed: {str(e)}", 
                    rule_id=f"{validator.rule_id}-CRASH"
                )

        return result
