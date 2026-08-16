# Contributing to Ice Stream

Thank you for your interest in contributing to Ice Stream! This document provides guidelines for participating in the project.

## Code of Conduct

- Be respectful and inclusive
- Focus on the code and ideas, not individuals
- Help others learn and grow
- Report issues through proper channels

## Getting Started

### Set Up Your Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/sanika-mankar/Ice-stream-lakehouse-observability.git
   cd ice-stream
   ```

2. **Create a Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Development Dependencies**
   ```bash
   pip install -e ".[dev]"
   ```

4. **Set Up Environment Variables**
   ```bash
   cp .env.example .env
   ```

### Verify Your Setup

```bash
make check  # Runs formatting, linting, type checking
make test   # Runs all tests
```

## Development Workflow

### 1. Create a Feature Branch

Never work directly on `main`. Always create a descriptive feature branch:

```bash
git checkout -b feature/short-description
# or
git checkout -b fix/issue-number-description
# or
git checkout -b docs/documentation-update
```

### 2. Make Meaningful Commits

Commits should be:
- **Atomic**: One logical change per commit
- **Clear**: Descriptive message explaining the "why"
- **Tested**: Changes pass relevant tests
- **Documented**: Update docs if behavior changes

**Commit Message Format:**

```
<type>: <subject>

<body (optional)>

Closes #<issue-number> (if applicable)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `chore`: Maintenance, dependencies
- `test`: Test additions/changes
- `refactor`: Code restructuring without behavior change
- `perf`: Performance improvements

**Examples:**

```bash
git commit -m "feat: add transaction validation engine"
git commit -m "docs: update data contract specification"
git commit -m "fix: handle NULL currency fields gracefully"
git commit -m "test: add validation edge case coverage"
```

### 3. Code Quality

**Before committing**, ensure:

```bash
# Format your code
make format

# Check for linting issues
make lint

# Type checking
make typecheck

# Run tests
make test

# All checks
make check
```

**Standards:**
- Use type hints throughout
- Follow PEP 8 style guide
- Write docstrings for public functions/classes
- Keep functions focused and testable
- Add logging at appropriate levels

### 4. Testing Requirements

- Add tests for new features
- Update tests when changing behavior
- Aim for meaningful coverage (not just percentage)
- Use deterministic, seeded test data
- Tests should be reproducible

```bash
# Run specific test file
python -m pytest tests/unit/test_validation.py -v

# Run with coverage
python -m pytest --cov=app tests/

# Run integration tests only
python -m pytest tests/integration -v
```

### 5. Documentation

Update documentation for:
- New features or APIs
- Configuration changes
- Operational procedures
- Architecture decisions
- Data contract changes

Documentation locations:
- Code comments for "how"
- Docstrings for functions/classes
- `docs/` for architecture and workflows
- README for quick start
- This file for contribution process

### 6. Push and Create a Pull Request

```bash
# Push your branch
git push origin feature/your-branch-name

# Create a pull request on GitHub with:
# - Clear title describing the change
# - Summary of what and why
# - Link to any related issues
# - Test results and validation steps
# - Screenshots/diffs if relevant
```

## Milestone-Based Development

We use an issue-based roadmap. Work on one milestone at a time:

```
1. Review and plan (read roadmap, understand context)
2. Implement (write code, add tests)
3. Verify (run checks, test coverage)
4. Commit (meaningful commit message)
5. Push (feature branch to GitHub)
6. PR (create pull request for review)
```

See [docs/roadmap.md](docs/roadmap.md) for current milestones.

## What We Don't Accept

- **Secrets**: API keys, tokens, passwords, certificates
- **Large files**: Use `.gitignore` for data/binaries
- **Unrelated changes**: Keep PRs focused
- **Incomplete work**: Finish before pushing
- **Fake/placeholder tests**: Only real, passing tests
- **Undocumented features**: Document as you build

## Review Process

When your PR is reviewed:

1. We may ask for changes or clarifications
2. Respond to feedback promptly
3. Push additional commits to the same branch
4. Reviewer approves and merges when ready

Be patient and respectful during review.

## Questions or Issues?

- Check [docs/](docs/) first
- Review existing [GitHub Issues](https://github.com/sanika-mankar/Ice-stream-lakehouse-observability/issues)
- Ask in issue discussions
- Create a new issue if needed

## Contributor Workflow Example

```bash
# 1. Start a feature
git checkout -b feature/transaction-validator

# 2. Make changes, commit regularly
git add app/validation/engine.py
git commit -m "feat: add transaction validation engine"

git add tests/unit/test_validation.py
git commit -m "test: add validation engine test suite"

# 3. Check everything works
make check
make test

# 4. Push and create PR
git push origin feature/transaction-validator
# (Create PR on GitHub)

# 5. Respond to review feedback
git add app/validation/engine.py
git commit -m "refactor: improve validation error messages"
git push origin feature/transaction-validator
```

## Important Notes

- **Never force push** to shared branches
- **Never commit secrets** or `.env` files
- **Always test locally** before pushing
- **Keep commits small** and focused
- **Update documentation** when behavior changes
- **Be kind and collaborative** — we're all learning

## Recognition

Contributors will be recognized in:
- Git history and commit authors
- `CONTRIBUTORS.md` (if applicable)
- Release notes
- Project README

Thank you for helping make Ice Stream better! 🙏

---

Questions? Start a discussion or open an issue on GitHub.
