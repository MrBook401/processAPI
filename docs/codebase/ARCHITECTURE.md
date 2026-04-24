# Architecture

## Core Sections (Required)

### 1) Architectural Style

- Primary style: Layered Architecture (Backend), Next.js App Router (Frontend)
- Why this classification: Backend is split into API routes (`src/api/`), business logic and repositories (`src/services/`), and data access (`src/db/`).
- Primary constraints: Uses a single SQLite database file meaning horizontal scaling of backend writes is constrained.

### 2) System Flow

```text
HTTP Request -> src/api/routes.ts -> src/services/[Service|Repository].ts -> src/db/sqlite.ts -> SQLite Database -> HTTP Response
```

- **Step 1:** Client sends an HTTP request to the Express backend (or Next.js UI interacts with its API Client in `src/ui/src/lib/api/client.ts`).
- **Step 2:** `src/api/routes.ts` handles the request, validates the schema (often via Zod in `src/types.ts`), and calls the appropriate service or repository.
- **Step 3:** Business logic is executed in `src/services/` (e.g., `WindowCalculationEngine.ts` calculates time window validity).
- **Step 4:** Data is queried or mutated via repositories (e.g., `EventRepository.ts`) which use the configured connection in `src/db/sqlite.ts`.
- **Step 5:** Repositories return mapped domain objects back to the route handler.
- **Step 6:** Route handler formats the JSON response and returns it to the client.

### 3) Layer/Module Responsibilities

| Layer or module | Owns | Must not own | Evidence |
|-----------------|------|--------------|----------|
| API (`src/api/`) | Request handling, routing, schema validation | Business logic, direct DB queries | `src/api/routes.ts` |
| Services (`src/services/`) | Business logic, calculations, data access (Repositories) | HTTP handling | `src/services/WindowCalculationEngine.ts` |
| DB (`src/db/`) | Database connection management and schema setup | Business logic | `src/db/sqlite.ts` |

### 4) Reused Patterns

| Pattern | Where found | Why it exists |
|---------|-------------|---------------|
| Repository Pattern | `src/services/EventRepository.ts`, `ReleaseRepository.ts`, `ApplicationRepository.ts` | Abstract database queries into methods returning domain objects. |
| Schema Validation (Zod) | `src/types.ts` | Standardizes type definitions and runtime validation of input data. |
| Engine/Strategy | `src/services/WindowCalculationEngine.ts` | Centralizes complex business rules (e.g., time window validation) outside of routes. |

### 5) Known Architectural Risks

- SQLite concurrency: Since a local `database.sqlite` file is used, scaling the backend to multiple instances (e.g., in Kubernetes or heavy load) will cause locks and conflicts.

### 6) Evidence

- `src/api/routes.ts`
- `src/services/EventRepository.ts`
- `src/services/WindowCalculationEngine.ts`
- `src/db/sqlite.ts`