# Ice Stream — Simple Working Guide

## 1. How We Will Build It

Do not build the whole project in one shot.

Use this cycle:

```text
PLAN
  ↓
IMPLEMENT
  ↓
RUN
  ↓
TEST
  ↓
INSPECT
  ↓
COMMIT
  ↓
PUSH
  ↓
NEXT MILESTONE
```

## 2. Before Every Milestone

Read:
- README.md
- roadmap
- relevant architecture document
- current Git status

Then inspect existing code.

## 3. After Every Milestone

Run the project's verification commands.

Typical commands:

```bash
python -m pytest
python -m ruff check .
python -m mypy app
```

The exact commands will be finalized in `pyproject.toml`.

## 4. Git Workflow

```bash
git status
git add .
git commit -m "feat: describe the change"
git push origin <branch>
```

Never commit:
- `.env`
- passwords
- API keys
- private certificates
- generated virtual environments
- huge temporary files.

## 5. Codex/Antigravity Rule

Give the coding agent one milestone at a time.

Recommended instruction pattern:

```text
You are working on Ice Stream.

First inspect the existing repository.

Implement ONLY Milestone X from the roadmap.

Do not rewrite unrelated working code.
Do not implement future milestones.
Follow the existing architecture.
Use type hints.
Add or update tests.
Update documentation if required.
Run the relevant tests and quality checks.
Report:
1. files changed,
2. implementation summary,
3. tests executed,
4. test results,
5. remaining issues.

Do not create fake functionality or placeholder success responses.
```

## 6. Definition of Done

A milestone is not done merely because the code exists.

It is done when:
- code works;
- expected failure cases work;
- tests exist;
- tests pass;
- logs are understandable;
- documentation is updated;
- no secrets are present;
- Git history clearly explains the change.

## 7. Team Collaboration

Member 1:
Dashboard + integration + documentation.

Member 2:
Generator + ingestion + validation.

Member 3:
Storage + observability + testing.

All members should communicate changes before modifying shared interfaces.

## 8. Real Data Principle

For the final demo, use realistic e-commerce transaction structures and controlled production-like failure scenarios.

Do not claim that the data is from a real company unless it actually is.

Synthetic data is acceptable for a portfolio project when it is clearly identified as synthetic.

## 9. Final Portfolio Evidence

The repository should eventually contain:

- architecture diagram;
- screenshots;
- sample clean records;
- sample quarantine records;
- quality metrics;
- test results;
- CI status;
- Docker instructions;
- demo instructions;
- technical decisions;
- limitations;
- future production extensions.
