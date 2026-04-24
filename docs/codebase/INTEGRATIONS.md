# External Integrations

## Core Sections (Required)

### 1) Integration Inventory

| System | Type (API/DB/Queue/etc) | Purpose | Auth model | Criticality | Evidence |
|--------|---------------------------|---------|------------|-------------|----------|
| Next.js Frontend -> Backend API | Internal API | Web UI interaction with Process Manager | Local dev proxy / CORS | High | `src/ui/src/lib/api/client.ts` |

*(Note: There are no third-party APIs integrated into this repository based on the scan).*

### 2) Data Stores

| Store | Role | Access layer | Key risk | Evidence |
|-------|------|--------------|----------|----------|
| SQLite | Primary relational database | `src/db/sqlite.ts` and `src/services/*Repository.ts` | File-locking under high concurrency | `package.json` |

### 3) Secrets and Credentials Handling

- Credential sources: `.env` (managed via `dotenv` in `src/api/app.ts` usually, though no explicit `.env.example` exists).
- Hardcoding checks: No hardcoded API keys detected in scan output.
- Rotation or lifecycle notes: [TODO] Unknown.

### 4) Reliability and Failure Behavior

- Retry/backoff behavior: None implemented (standard Express request handling).
- Timeout policy: Standard Node.js HTTP timeouts.
- Circuit-breaker or fallback behavior: None.

### 5) Observability for Integrations

- Logging around external calls: None detected (standard `console.log` for backend errors).
- Metrics/tracing coverage: No APM or tracing detected.
- Missing visibility gaps: No structured logging, request correlation IDs, or error tracking system (e.g., Sentry) are configured.

### 6) Evidence

- `package.json`
- `src/ui/src/lib/api/client.ts`
- `src/db/sqlite.ts`