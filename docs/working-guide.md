# Ice Stream — Working Guide

## Daily Development Workflow

This guide describes the recommended workflow for developing Ice Stream features.

## Before You Start

### Read the Roadmap

```bash
cat docs/roadmap.md
```

Understand:
- Which phase are we in?
- What's the current milestone?
- What's the next milestone?

### Review the Architecture

```bash
cat docs/architecture.md
```

Understand:
- How does the system work?
- Where does my feature fit?
- What layers are involved?

### Check the Current State

```bash
git status
git log --oneline -5
```

Understand:
- What's already been done?
- What's in progress?
- What's the latest work?

## Development Cycle for Each Milestone

### Phase 1: Plan

1. Read milestone description in roadmap
2. Understand requirements
3. Plan implementation approach
4. Design data structures if needed
5. Sketch tests mentally
6. Create/claim GitHub issue

**Guidance:** Don't code yet. Understand first.

### Phase 2: Implement

1. Create feature branch
   ```bash
   git checkout -b feature/<milestone-name>
   ```

2. Write code following standards:
   - Type hints required
   - Docstrings for public APIs
   - Modular and testable
   - Clean separation of concerns

3. Add tests as you go
   ```bash
   # Create test file
   tests/unit/test_feature.py
   ```

4. Run checks regularly
   ```bash
   make format
   make lint
   make typecheck
   ```

### Phase 3: Verify

```bash
# Run all checks
make check

# Expected output:
# ✅ Code formatted
# ✅ No linting issues
# ✅ Type checking passed
# ✅ All tests passed
```

If anything fails, fix it. Don't commit broken code.

### Phase 4: Commit

```bash
# Stage changes
git add .

# Commit with meaningful message
git commit -m "feat: describe what you implemented"
```

One commit per logical change. Related changes can be one commit.

### Phase 5: Push and PR

```bash
# Push branch
git push origin feature/<milestone-name>

# Create PR on GitHub with:
# - Clear title
# - Description of changes
# - Test results
# - Link to milestone/issue
```

### Phase 6: Code Review

- Respond to feedback
- Make requested changes
- Push additional commits
- Get approval

### Phase 7: Merge

Once approved:
```bash
# Make sure up to date
git fetch origin
git rebase origin/main
git push origin feature/<milestone-name>

# Merge on GitHub
# (or merge locally and push)
```

## Code Standards

### Type Hints (Required)

All functions and classes must have type hints:

```python
def validate_transaction(event: dict) -> ValidationResult:
    """Validate a transaction event.
    
    Args:
        event: Transaction event dictionary
    
    Returns:
        ValidationResult with validation details
    """
    # Implementation
```

### Docstrings (Required for Public)

Public functions, classes, and modules need docstrings:

```python
"""Transaction validation engine.

This module provides the main validation orchestrator that runs
multiple validators and aggregates results.
"""

class ValidationEngine:
    """Orchestrates transaction validation.
    
    Runs schema validation, business rule checks, and duplicate
    detection in sequence.
    """
    
    def validate(self, event: dict) -> ValidationResult:
        """Validate a single event.
        
        Args:
            event: Event dictionary to validate
        
        Returns:
            ValidationResult with is_valid flag and errors
        
        Raises:
            ValueError: If event structure is invalid
        """
```

### Logging

Use structured logging with appropriate levels:

```python
import logging

logger = logging.getLogger(__name__)

def process_event(event: dict) -> None:
    """Process an event."""
    logger.info("Processing event", extra={"event_id": event["event_id"]})
    
    try:
        # Process
        logger.debug("Event processed successfully")
    except ValueError as e:
        logger.error("Failed to process event", exc_info=True)
```

### Testing

Write deterministic, focused tests:

```python
def test_required_field_validation():
    """Test that required fields are validated."""
    # Arrange
    event = {"field1": "value", "field2": None}
    
    # Act
    result = validate_required_fields(event)
    
    # Assert
    assert not result.is_valid
    assert "DQ-002" in result.failed_rules
```

## Common Development Tasks

### Running Tests

```bash
# All tests
make test

# Specific test file
python -m pytest tests/unit/test_validation.py -v

# Specific test
python -m pytest tests/unit/test_validation.py::test_required_fields -v

# With coverage
make coverage
open htmlcov/index.html
```

### Checking Code Quality

```bash
# Format code
make format

# Check linting
make lint

# Type checking
make typecheck

# All checks at once
make check
```

### Adding Dependencies

1. Update `pyproject.toml` if base dependency
2. Update `pyproject.toml` if optional dependency
3. Install with `pip install -e ".[dev]"`
4. Document in README

### Creating Test Data

Place test fixtures in `tests/fixtures/`:

```python
# tests/fixtures/transactions.py
def valid_transaction() -> dict:
    """Return a valid transaction."""
    return {
        "event_id": "evt_test_001",
        "transaction_id": "txn_001",
        # ... all required fields ...
    }

def invalid_transaction_missing_field() -> dict:
    """Return transaction missing required field."""
    return {
        "event_id": "evt_test_002",
        # missing customer_id
    }
```

Use in tests:

```python
from tests.fixtures.transactions import valid_transaction

def test_valid_transaction():
    result = validate(valid_transaction())
    assert result.is_valid
```

### Creating Documentation

1. Code documentation in docstrings
2. Architecture in `docs/architecture.md`
3. API documentation in `docs/` folder
4. User guides in `docs/working-guide.md`
5. Keep README.md updated

## Project Structure

```
ice-stream/
├── app/                 # Main application
│   ├── __init__.py
│   ├── config/          # Configuration
│   ├── domain/          # Domain models
│   ├── ingestion/       # Event ingestion
│   ├── validation/      # Validation logic
│   ├── pipeline/        # Processing orchestration
│   ├── storage/         # Data persistence
│   ├── observability/   # Metrics and monitoring
│   └── logging/         # Logging setup
│
├── tests/               # Test suite
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   ├── fixtures/       # Test data
│   └── conftest.py     # Pytest configuration
│
├── dashboard/          # Streamlit UI
├── data/              # Local data
├── docs/              # Documentation
└── scripts/           # Utility scripts
```

## Troubleshooting

### Tests are failing locally but passed in CI

1. Check Python version: `python --version`
2. Reinstall dependencies: `pip install -e ".[dev]" --force-reinstall`
3. Clear cache: `find . -type d -name __pycache__ -exec rm -rf {} +`
4. Re-run tests: `make test`

### Import errors

1. Verify virtual environment: `which python`
2. Reinstall package: `pip install -e "."`
3. Check PYTHONPATH: `echo $PYTHONPATH`

### Code formatter changed files unexpectedly

1. Run `make format` to standardize
2. Review changes: `git diff`
3. Commit formatted code: `git add . && git commit -m "style: auto-format"`

### Merge conflicts

1. Fetch latest: `git fetch origin`
2. Rebase: `git rebase origin/main`
3. Resolve conflicts in editor
4. Continue: `git rebase --continue`
5. Push: `git push origin feature/<name> --force`

## Key Points to Remember

1. **Read before coding**: Understand requirements first
2. **Type hints required**: No exceptions
3. **Tests matter**: Write tests as you code
4. **Commit often**: One logical change per commit
5. **Verify locally**: All checks must pass before pushing
6. **No secrets**: Never commit .env or credentials
7. **Small PRs**: Easier to review and understand
8. **Meaningful commits**: Help future developers understand why
9. **Respond to reviews**: Be open to feedback
10. **Ask questions**: It's okay not to understand everything

## Getting Help

1. **Check documentation**: Read docs/ first
2. **Check examples**: Look at similar code
3. **Check tests**: Tests show how to use code
4. **Ask in issues**: Create GitHub issue with question
5. **Discuss in PR**: Ask reviewer for clarification

## Quality Checklist

Before pushing, verify:

- ✅ Code formatted (`make format`)
- ✅ No linting issues (`make lint`)
- ✅ Type checking passes (`make typecheck`)
- ✅ All tests pass (`make test`)
- ✅ No secrets in code (`.env` in `.gitignore`)
- ✅ No unrelated changes
- ✅ Meaningful commit messages
- ✅ Tests for new code
- ✅ Docstrings for public APIs
- ✅ Documentation updated

If all ✅, you're ready to push!

## Example Milestone: Required Field Validation

Following this guide:

### Phase 1: Plan
```bash
# Read what needs to be done
cat docs/roadmap.md | grep "Milestone 13"
# Understand: detect missing and NULL required fields

# Review architecture
cat docs/architecture.md | grep -A 20 "Validation Layer"

# Create issue for tracking
```

### Phase 2: Implement
```bash
# Create branch
git checkout -b feature/required-field-validation

# Create domain model for validation result
# app/domain/validation.py

# Create validator
# app/validation/required_fields.py

# Add tests
# tests/unit/test_required_fields.py
```

### Phase 3: Verify
```bash
make check
# ✅ All checks passing
```

### Phase 4: Commit
```bash
git add app/domain/validation.py
git commit -m "feat: add validation result domain model"

git add app/validation/required_fields.py
git commit -m "feat: implement required field validator"

git add tests/unit/test_required_fields.py
git commit -m "test: add required field validation tests"
```

### Phase 5-7: Push, PR, Merge
```bash
git push origin feature/required-field-validation
# Create PR on GitHub
# Respond to reviews
# Get merged
```

Done! Move to next milestone.

---

See [roadmap.md](roadmap.md) for what to build and [github-workflow.md](github-workflow.md) for how to contribute.
