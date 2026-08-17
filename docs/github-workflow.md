# Ice Stream — GitHub Workflow and Contribution Strategy

## Overview

Ice Stream uses a collaborative contributor workflow with feature branches, code review, and meaningful commits. This document describes the workflow.

## Branch Strategy

### Main Branches

- **`main`**: Production-ready code, protected branch
  - Only accepts pull requests
  - Requires passing checks
  - Requires code review

### Feature Branches

- **`feature/<description>`**: New features
- **`fix/<issue-number>`**: Bug fixes
- **`docs/<description>`**: Documentation
- **`chore/<description>`**: Maintenance and tooling
- **`refactor/<description>`**: Code improvements without behavior change

### Branch Naming

```
feature/transaction-validator
feature/kafka-integration
fix/123-null-handling
docs/api-reference
chore/upgrade-dependencies
```

## Workflow Steps

### 1. Plan Your Work

Before starting:

```bash
# Check the roadmap
cat docs/roadmap.md

# Review the architecture
cat docs/architecture.md

# Look at open issues/milestones
# On GitHub: Issues tab
```

### 2. Create Your Branch

```bash
# Update main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Example
git checkout -b feature/duplicate-detection
```

### 3. Make Changes

Write your code following:

- Type hints (mandatory)
- Tests (for features)
- Code quality standards
- Documentation updates

### 4. Verify Locally

```bash
# Format code
make format

# Run checks
make lint
make typecheck

# Run tests
make test

# All checks
make check
```

Must pass before committing!

### 5. Commit Your Work

```bash
# Stage changes
git add .

# Commit with meaningful message
git commit -m "feat: add duplicate event detection"

# Example commits
git commit -m "feat: implement validation engine"
git commit -m "test: add validation engine tests"
git commit -m "docs: update data contract"
```

### 6. Push Your Branch

```bash
# Push to GitHub
git push origin feature/your-feature-name

# First time push
git push -u origin feature/your-feature-name
```

### 7. Create a Pull Request

On GitHub:

1. Go to repository
2. Click "Pull Requests" tab
3. Click "New Pull Request"
4. Select your branch
5. Fill in title and description

**PR Title Format:**

```
feat: add duplicate event detection
```

**PR Description Template:**

```markdown
## Summary
Brief description of what this PR does.

## Changes
- Change 1
- Change 2
- Change 3

## Testing
Describe how you tested:
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Verification
Run locally:
```bash
make check  # All checks
make test   # All tests
```

Result: ✅ All checks passing

## Related Issues
Closes #123

## Screenshots/Diffs (if applicable)
Before/After or visual changes
```

### 8. Code Review

- Reviewer examines code
- May request changes
- Push additional commits to same branch
- Reviewer approves when satisfied

### 9. Merge

Once approved:

1. Ensure branch is up to date with main
   ```bash
   git fetch origin
   git rebase origin/main
   git push origin feature/your-feature-name --force
   ```

2. Merge on GitHub (or locally):
   ```bash
   git checkout main
   git pull origin main
   git merge --no-ff feature/your-feature-name
   git push origin main
   ```

3. Delete feature branch:
   ```bash
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```

## Commit Message Guidelines

### Format

```
<type>: <subject>

<body (optional)>

Closes #<issue-number>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation
- **test**: Test additions/changes
- **chore**: Maintenance, dependencies
- **refactor**: Code restructuring
- **perf**: Performance improvement

### Subject Line

- Imperative mood ("add" not "added")
- No period at end
- 50 characters or less
- Lowercase

### Body (Optional)

- Explain what and why
- Wrap at 72 characters
- Separate from subject with blank line

### Examples

Good:
```
feat: add transaction validation engine

Implement comprehensive validation with multiple validators
for completeness, type, range, enum, schema compatibility,
and uniqueness checks.
```

Bad:
```
Added validation
```

Great:
```
fix: handle NULL currency fields gracefully

Skip validation for NULL currency instead of crashing.
Updates DQ-005 rule to handle nullable fields.

Closes #42
```

## Pull Request Etiquette

### What to Include

- ✅ Clear title and description
- ✅ Link to related issues
- ✅ Test results showing all passing
- ✅ Any necessary documentation changes
- ✅ Screenshots if UI changes

### What NOT to Include

- ❌ Secrets or .env files
- ❌ Unrelated changes
- ❌ Broken tests or checks
- ❌ Incomplete work
- ❌ Commented-out code

### Code Review Process

1. **Respectful Discussion**: Questions are asked as learning
2. **Constructive Feedback**: Focused on code, not person
3. **Clear Expectations**: Explain why change is needed
4. **Acknowledge Good Work**: Praise improvements
5. **Be Patient**: Reviews take time

### As a Reviewer

```
✅ Code Quality
  - Is the code clear and maintainable?
  - Are type hints used?
  - Does it follow project conventions?

✅ Testing
  - Are tests included?
  - Do tests cover the change?
  - Are tests deterministic?

✅ Documentation
  - Is code documented?
  - Is user-facing docs updated?
  - Are edge cases mentioned?

✅ Performance
  - Are there obvious inefficiencies?
  - Would alternative approach be better?
  - Any memory/resource concerns?

✅ Security
  - Are secrets protected?
  - Is input validated?
  - Any injection risks?
```

## Conflict Resolution

When your branch conflicts with main:

```bash
# Update main
git fetch origin
git rebase origin/main

# If conflicts occur
# 1. Edit conflicting files
# 2. Resolve conflicts (keep both, keep ours, keep theirs)
# 3. Continue rebase
git add .
git rebase --continue

# Push updated branch
git push origin feature/your-feature-name --force
```

## Common Scenarios

### Scenario 1: Small Fix

```bash
git checkout -b fix/typo-in-readme
# Edit file
git add .
git commit -m "docs: fix typo in README"
git push origin fix/typo-in-readme
# Create PR
```

### Scenario 2: Feature Development

```bash
git checkout -b feature/validation-engine
# Implement validation engine
git add app/validation/engine.py
git commit -m "feat: add validation engine"

# Add tests
git add tests/unit/test_validation.py
git commit -m "test: add validation engine tests"

# Update docs
git add docs/architecture.md
git commit -m "docs: update architecture with validation details"

git push origin feature/validation-engine
# Create PR
```

### Scenario 3: Responding to Review

```bash
# Reviewer asks for changes
# Make changes
git add .
git commit -m "refactor: improve validation error messages"

# Push updated commit
git push origin feature/validation-engine
# No new PR needed, existing PR updates
```

## Git Safety Checks

Before pushing, always verify:

```bash
# Check branch
git branch --show-current
# Should be your feature branch, NOT main

# Check remote
git remote -v
# Should be correct repository

# Check for secrets
git diff origin/main
# Should not contain .env, passwords, tokens

# Check commit log
git log --oneline -5
# Should show your meaningful commits
```

## Useful Git Commands

```bash
# See what branch you're on
git branch --show-current

# See all branches
git branch -a

# See recent commits
git log --oneline -10

# See changes in current branch
git diff main

# See staged changes
git diff --cached

# See changes in specific file
git diff path/to/file.py

# Undo uncommitted changes
git restore path/to/file.py

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Squash last N commits
git rebase -i HEAD~N

# Update with latest main
git fetch origin
git rebase origin/main

# Clean up branches
git branch -d feature/old-branch
git push origin --delete feature/old-branch
```

## When Things Go Wrong

### Accidentally committed to main

```bash
# Create new branch with uncommitted changes
git branch feature/my-feature
git reset --hard origin/main
git checkout feature/my-feature
```

### Need to undo a commit

```bash
# If not pushed yet
git reset --soft HEAD~1

# If already pushed
git revert <commit-hash>
git push origin main
```

### Merge conflict in PR

1. Update your branch with latest main
2. Resolve conflicts locally
3. Push updated branch
4. PR updates automatically

## Integration with Issues

### Link PR to Issue

In PR description:
```
Closes #123
Fixes #456
Related to #789
```

### Create Issue Before Major Work

1. Create GitHub issue describing feature/fix
2. Discuss approach in issue
3. Reference issue in commits: `git commit -m "feat: add X (closes #123)"`
4. Link PR to issue

## Continuous Integration

Each PR triggers automated checks:

```
✅ Format Check (black)
✅ Lint Check (ruff)
✅ Type Check (mypy)
✅ Tests (pytest)
✅ Coverage Check
```

All must pass before merging.

---

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed contribution guidelines and [roadmap.md](roadmap.md) for development priorities.
