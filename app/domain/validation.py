"""Validation result domain model.

Represents the outcome of validating a transaction against quality rules.
"""

from dataclasses import dataclass, field


@dataclass
class ValidationResult:
    """Result of validating a transaction.
    
    Attributes:
        is_valid: Whether the transaction passed all validations
        errors: List of error messages for failed validations
        warnings: List of non-blocking warnings
        rule_ids: All rule IDs that were checked
        failed_rules: Rule IDs that failed validation
        rule_details: Detailed error messages per rule
    """

    is_valid: bool
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    rule_ids: list[str] = field(default_factory=list)
    failed_rules: list[str] = field(default_factory=list)
    rule_details: dict[str, str] = field(default_factory=dict)

    def add_error(self, message: str, rule_id: str) -> None:
        """Add an error to the validation result.
        
        Args:
            message: Error message
            rule_id: Rule ID that failed (e.g., DQ-001)
        """
        self.errors.append(message)
        self.failed_rules.append(rule_id)
        self.rule_details[rule_id] = message
        self.is_valid = False

    def add_warning(self, message: str) -> None:
        """Add a warning to the validation result.
        
        Args:
            message: Warning message
        """
        self.warnings.append(message)

    def to_dict(self) -> dict:
        """Convert validation result to dictionary.
        
        Returns:
            Dictionary representation
        """
        return {
            "is_valid": self.is_valid,
            "errors": self.errors,
            "warnings": self.warnings,
            "rule_ids": self.rule_ids,
            "failed_rules": self.failed_rules,
            "rule_details": self.rule_details,
        }
