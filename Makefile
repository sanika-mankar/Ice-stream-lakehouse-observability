.PHONY: help install install-dev format lint typecheck test coverage check clean run-dashboard setup

help:
	@echo "Ice Stream — Development Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make setup          Create virtual environment and install dependencies"
	@echo "  make install        Install production dependencies"
	@echo "  make install-dev    Install development dependencies"
	@echo ""
	@echo "Code Quality:"
	@echo "  make format         Format code with black and isort"
	@echo "  make lint           Run ruff linter"
	@echo "  make typecheck      Run mypy type checking"
	@echo "  make check          Run all quality checks (format, lint, typecheck)"
	@echo ""
	@echo "Testing:"
	@echo "  make test           Run all tests"
	@echo "  make test-unit      Run unit tests only"
	@echo "  make test-integration Run integration tests only"
	@echo "  make coverage       Run tests with coverage report"
	@echo ""
	@echo "Running:"
	@echo "  make run-dashboard  Start Streamlit dashboard"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean          Clean up build artifacts and caches"
	@echo "  make clean-env      Clean environment and reinstall"

setup:
	python -m venv venv
	. venv/bin/activate && pip install --upgrade pip setuptools wheel
	. venv/bin/activate && pip install -e ".[dev]"
	cp .env.example .env
	@echo "✅ Development environment ready! Run 'source venv/bin/activate' (or 'venv\\Scripts\\activate' on Windows)"

install:
	pip install -e "."

install-dev:
	pip install -e ".[dev]"

format:
	@echo "🎨 Formatting code..."
	black .
	isort .
	@echo "✅ Code formatted"

lint:
	@echo "🔍 Linting code..."
	ruff check .
	@echo "✅ No linting issues found"

typecheck:
	@echo "🔤 Type checking..."
	mypy app
	@echo "✅ Type checking passed"

test:
	@echo "🧪 Running tests..."
	pytest

test-unit:
	@echo "🧪 Running unit tests..."
	pytest tests/unit -v

test-integration:
	@echo "🧪 Running integration tests..."
	pytest tests/integration -v

coverage:
	@echo "📊 Running tests with coverage..."
	pytest --cov=app --cov-report=html --cov-report=term-missing
	@echo "✅ Coverage report generated in htmlcov/index.html"

check: format lint typecheck test
	@echo "✅ All checks passed!"

clean:
	@echo "🧹 Cleaning up..."
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf .pytest_cache
	rm -rf .mypy_cache
	rm -rf .coverage
	rm -rf htmlcov
	rm -rf dist
	rm -rf build
	@echo "✅ Cleaned up"

clean-env:
	@echo "🧹 Removing virtual environment..."
	rm -rf venv
	$(MAKE) setup

run-dashboard:
	@echo "🚀 Starting Streamlit dashboard..."
	streamlit run dashboard/app.py

.DEFAULT_GOAL := help
