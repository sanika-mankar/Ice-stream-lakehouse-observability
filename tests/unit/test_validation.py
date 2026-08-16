"""Unit tests for ValidationResult domain model."""

from app.domain.validation import ValidationResult


def test_create_valid_result() -> None:
    """Test creating a valid validation result."""
    result = ValidationResult(
        is_valid=True,
        rule_ids=["DQ-001", "DQ-002", "DQ-003"],
    )

    assert result.is_valid
    assert len(result.errors) == 0
    assert len(result.failed_rules) == 0


def test_create_invalid_result() -> None:
    """Test creating an invalid validation result."""
    result = ValidationResult(
        is_valid=False,
        errors=["Customer ID is missing"],
        failed_rules=["DQ-001"],
        rule_ids=["DQ-001", "DQ-002"],
    )

    assert not result.is_valid
    assert len(result.errors) == 1
    assert "DQ-001" in result.failed_rules


def test_add_error() -> None:
    """Test adding an error to validation result."""
    result = ValidationResult(is_valid=True)

    result.add_error("Required field missing: customer_id", "DQ-001")

    assert not result.is_valid
    assert len(result.errors) == 1
    assert "DQ-001" in result.failed_rules
    assert result.rule_details["DQ-001"] == "Required field missing: customer_id"


def test_add_warning() -> None:
    """Test adding a warning to validation result."""
    result = ValidationResult(is_valid=True)

    result.add_warning("Event timestamp is very old")

    assert result.is_valid  # Warning doesn't invalidate
    assert len(result.warnings) == 1


def test_validation_result_to_dict() -> None:
    """Test converting validation result to dictionary."""
    result = ValidationResult(
        is_valid=False,
        errors=["Invalid amount"],
        failed_rules=["DQ-004"],
    )

    result_dict = result.to_dict()

    assert result_dict["is_valid"] is False
    assert len(result_dict["errors"]) == 1
    assert "DQ-004" in result_dict["failed_rules"]
