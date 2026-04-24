# Codebase Concerns

## Core Sections (Required)

### 1) Top Risks (Prioritized)

| Severity | Concern | Evidence | Impact | Suggested action |
|----------|---------|----------|--------|------------------|
| High | SQLite Concurrency in Production | `src/db/sqlite.ts` & `database.sqlite` tracked in git | Locks or data corruption if deployed across multiple containers | Move to PostgreSQL/MySQL for PROD; add `database.sqlite` to `.gitignore`. |
| Med | Hardcoded Secret/Env Handling | Missing `.env.example` in repo | Difficulty for new developers onboarding to configure local environments | Add `.env.example` with required variables. |
| Med | Lack of Frontend Tests | `src/ui/` lacks test directories | UI regressions | Add Jest/RTL or Playwright to frontend. |

### 2) Technical Debt

| Debt item | Why it exists | Where | Risk if ignored | Suggested fix |
|-----------|---------------|-------|-----------------|---------------|
| `database.sqlite` in Git | Likely accidentally committed | Repository Root | Git merge conflicts on db file | Run `git rm --cached database.sqlite` and add to `.gitignore`. |

### 3) Security Concerns

| Risk | OWASP category (if applicable) | Evidence | Current mitigation | Gap |
|------|--------------------------------|----------|--------------------|-----|
| Missing Auth | A01:2021-Broken Access Control | No auth middleware visible | None | Anyone can create events/validate releases. |

### 4) Performance and Scaling Concerns

| Concern | Evidence | Current symptom | Scaling risk | Suggested improvement |
|---------|----------|-----------------|-------------|-----------------------|
| Database Locking | `src/db/sqlite.ts` | None currently | SQLite limits concurrent writes | Migrate to PostgreSQL if multiple instances are required. |

### 5) Fragile/High-Churn Areas

| Area | Why fragile | Churn signal | Safe change strategy |
|------|-------------|-------------|----------------------|
| `src/types.ts` | Central point of validation and type definition | 7 commits in last 90 days | Run `npm run tsc` and `npm run test` after any modifications here. |
| `src/services/EventRepository.ts` | Core domain repository mapping | 6 commits in last 90 days | Ensure integration tests pass for new event structures. |

### 6) `[ASK USER]` Questions

1. [ASK USER] Should `database.sqlite` be removed from Git tracking and added to `.gitignore`?
2. [ASK USER] Is there a plan to migrate from SQLite to PostgreSQL for production workloads, or is this service intended to run as a single instance?
3. [ASK USER] Are there authentication/authorization requirements planned for the API?

### 7) Evidence

- `docs/codebase/.codebase-scan.txt` (Git Churn & Files)
- `src/db/sqlite.ts`