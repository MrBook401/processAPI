# Codebase Structure

## Core Sections (Required)

### 1) Top-Level Map

| Path | Purpose | Evidence |
|------|---------|----------|
| `docs/` | Project documentation, planning, and specifications | Tree output |
| `spec/` | Technical specifications (e.g., API design) | Tree output |
| `src/` | Backend source code and entry point | Tree output |
| `src/api/` | Express application setup, routes, and Swagger docs | `src/api/routes.ts` |
| `src/db/` | SQLite database setup and connection | `src/db/sqlite.ts` |
| `src/services/` | Business logic and database repositories | `src/services/EventRepository.ts` |
| `src/tests/` | Backend unit and integration tests | Tree output |
| `src/ui/` | Next.js frontend application | `src/ui/package.json` |

### 2) Entry Points

- Main runtime entry: `src/index.ts` (Backend) and `src/ui/src/app/page.tsx` (Frontend UI)
- Secondary entry points (worker/cli/jobs): NONE
- How entry is selected (script/config): via `package.json` scripts (`start`, `dev`) and Dockerfile CMD.

### 3) Module Boundaries

| Boundary | What belongs here | What must not be here |
|----------|-------------------|------------------------|
| `src/api/` | HTTP route definitions, request validation, swagger | Business logic or DB queries |
| `src/services/` | Business logic, calculations, DB repositories | HTTP parsing, Express req/res |
| `src/db/` | Database initialization and connection pool | Business logic |
| `src/ui/` | Frontend React components and API clients | Direct database connections |

### 4) Naming and Organization Rules

- File naming pattern: PascalCase for Services and Repositories (e.g., `WindowCalculationEngine.ts`), camelCase or lowercase for other files (e.g., `routes.ts`, `sqlite.ts`).
- Directory organization pattern: Layer-based (api, db, services, tests, ui).
- Import aliasing or path conventions: Standard relative imports in backend (`../services/`). Next.js uses standard conventions (`@/` not explicitly seen but standard).

### 5) Evidence

- Directory tree scan
- `package.json`
- `src/index.ts`
- `src/ui/src/app/page.tsx`