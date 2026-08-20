# Ice Stream — GitHub Commit Strategy

## Important

The project should have meaningful commits, not artificial commits.

Each commit should:
- do one understandable thing;
- pass relevant tests;
- have a clear message;
- be easy to revert or debug.

## Around 7 Commits Per Major File/Area

This is a guideline, not a rule to split tiny files unnecessarily.

### A. Project/Documentation Area

1. `chore: initialize Ice Stream repository`
2. `docs: add project architecture`
3. `docs: add engineering roadmap`
4. `docs: document system flow`
5. `docs: add data contract`
6. `docs: add local development guide`
7. `docs: add production runbook`

### B. Transaction Generator

1. `feat: add transaction domain model`
2. `feat: add realistic transaction generator`
3. `feat: add configurable event volume`
4. `feat: add deterministic seed support`
5. `feat: add invalid-event scenarios`
6. `test: cover transaction generator`
7. `docs: document event generation`

### C. Validation Engine

1. `feat: add validation engine`
2. `feat: add required field validation`
3. `feat: add type validation`
4. `feat: add business rules`
5. `feat: add schema evolution checks`
6. `test: add validation test suite`
7. `docs: document data quality rules`

### D. Storage

1. `feat: add DuckDB storage`
2. `feat: add clean data persistence`
3. `feat: add quarantine persistence`
4. `feat: add Parquet output`
5. `feat: add partitioning`
6. `test: add storage integration tests`
7. `fix: make storage writes idempotent`

### E. Observability

1. `feat: add pipeline counters`
2. `feat: add latency metrics`
3. `feat: add quality score`
4. `feat: add failure analytics`
5. `feat: add health status`
6. `feat: add alert thresholds`
7. `test: cover observability calculations`

### F. Dashboard

1. `feat: create Streamlit dashboard`
2. `feat: add pipeline overview`
3. `feat: add quality analytics`
4. `feat: add latency and throughput charts`
5. `feat: add quarantine explorer`
6. `fix: improve dashboard error states`
7. `docs: document dashboard usage`

## Pull Request Rule

A pull request should explain:

### What changed?
Short summary.

### Why?
Business/engineering reason.

### How tested?
Commands and results.

### Risks?
Any compatibility or migration concern.

### Screenshots
For dashboard changes, attach screenshots.

## Release Rule

Before final release:

```text
tests pass
lint passes
type checks pass
Docker build passes
documentation is current
.env.example is current
no secrets are committed
dashboard works
bad records are traceable
clean records are queryable
quarantine records are explainable
```
