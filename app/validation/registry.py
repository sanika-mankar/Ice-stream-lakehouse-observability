"""Validation registry and interfaces.

Defines the base Validator interface and the registry to hold active rules.
"""

from abc import ABC, abstractmethod
from typing import Any

from app.domain.validation import ValidationResult


class Validator(ABC):
    """Base interface for all data quality validators."""

    @property
    @abstractmethod
    def rule_id(self) -> str:
        """Unique identifier for the rule (e.g., DQ-001)."""
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        """Human-readable description of what the rule checks."""
        pass

    @abstractmethod
    def validate(self, data: dict[str, Any], result: ValidationResult) -> None:
        """Validate the data and update the result.

        Args:
            data: The raw event dictionary
            result: The ValidationResult to update with errors or warnings
        """
        pass


class ValidationRegistry:
    """Registry to hold and manage all active validators."""

    def __init__(self) -> None:
        self._validators: list[Validator] = []

    def register(self, validator: Validator) -> None:
        """Register a new validator.

        Args:
            validator: An instance of a Validator subclass
        """
        self._validators.append(validator)

    def get_all(self) -> list[Validator]:
        """Get all registered validators.

        Returns:
            List of active validators
        """
        return self._validators.copy()
