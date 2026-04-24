# Testing Patterns

## Core Sections (Required)

### 1) Test Stack and Commands

- Primary test framework: Jest ^30.3.0
- Assertion/mocking tools: ts-jest, supertest ^7.2.2 (for API tests)
- Commands:

```bash
npm run test # runs jest
```

### 2) Test Layout

- Test file placement pattern: All tests are located inside the `src/tests/` directory.
- Naming convention: `*.test.ts`
- Setup files and where they run: `jest.config.js` configures the runner.

### 3) Test Scope Matrix

| Scope | Covered? | Typical target | Notes |
|-------|----------|----------------|-------|
| Unit | Yes | `src/services/` | Tests business logic independently (e.g. `WindowCalculationEngine.test.ts`). |
| Integration | Yes | API routes & DB | `api.test.ts` hits real HTTP routes using `supertest`. |
| E2E | No | UI to Backend | Not configured. |

### 4) Mocking and Isolation Strategy

- Main mocking approach: Jest mocks or passing mocked object fixtures directly to engine functions.
- Isolation guarantees: Unknown if the database is reset before each integration test (likely relies on SQLite in-memory or a clean file).
- Common failure mode in tests: TypeScript schema mismatches when `Event` types are refactored.

### 5) Coverage and Quality Signals

- Coverage tool + threshold: [TODO] No explicitly defined threshold in `jest.config.js` seen from scan, though the spec document asks for 100% on validation logic.
- Current reported coverage: [TODO] Unknown without running the coverage command.
- Known gaps/flaky areas: Frontend Next.js has no tests.

### 6) Evidence

- `package.json`
- `src/tests/api.test.ts`
- `src/tests/WindowCalculationEngineStandard.test.ts`
- `spec/spec-design-process-manager-api.md`