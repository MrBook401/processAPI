# Test Coverage Increase Plan

## Current State

**Overall Coverage: 82.67% statements, 70.58% branches, 91.42% functions, 82.37% lines**

| Module | Statements | Branches | Functions | Lines |
|--------|-----------|----------|-----------|-------|
| src/ (entry) | 100% | 100% | 100% | 100% |
| src/api/ | **68.84%** | 51.11% | 76.92% | 68.61% |
| src/db/ | 100% | 83.33% | 100% | 100% |
| src/services/ | 98.87% | 86.27% | 100% | 100% |

**Key finding: `src/api/routes.ts` is the primary gap — ~69% coverage with weak branch coverage at 51%.**

---

## Detailed Gap Analysis

### src/api/routes.ts — Missing Tests (~70 uncovered lines)

| Route | Current Coverage | What's Missing |
|-------|-----------------|----------------|
| `POST /events` | Partial (201 + 400 validation) | ✅ Covered |
| `GET /events` | Partial (200 + mock 500) | ✅ Covered |
| `PATCH /events/:id` | Partial (200 + 404) | ✅ Covered |
| `GET /events/:id/releases` | ❌ Not tested | Full happy path + 404 event not found |
| `POST /release/attach` | Partial (201 + 404) | ✅ Covered, duplicate release scenario tested in nested describe |
| `DELETE /release/attach/:releaseId` | ❌ Not tested | 404 when release not found, happy path |
| `PATCH /release/attach` | ❌ Not tested | Update existing attachment, 404 event not found, 404 release not found |
| `GET /release/validate/id` | Partial (valid + invalid) | ❌ Missing: missing params (400), not attached to event (400), invalid timestamp |
| `POST /applications` | Partial (201 + 400) | ✅ Covered |
| `GET /applications` | Partial (200) | ✅ Covered via aggregation in page test |
| `GET /releases` | ❌ Not tested | Full list returns releases |
| `GET /events/search/` | ❌ Not tested | ✅ Covered with name param, missing: 400 (missing/empty name), 404 (no releases found) |

### src/services/WindowCalculationEngine.ts — Minor Gaps (~2 uncovered lines)

Based on the code, likely missing:
- `event.event_enabled = false` → returns validation error
- `event.event_open_for_delivery = false` → returns validation error

### Missing Test File: types.ts Schema Validation

| Schema | Tests Needed |
|--------|-------------|
| `CreateEventSchema` | Missing fields, invalid datetime format, extra fields, type validation |
| `UpdateEventSchema` | Partial updates (each field independently), empty update object |
| `AttachReleaseSchema` | Empty releaseId, invalid UUID for eventId |
| `CreateApplicationSchema` | Missing name, empty environments array, invalid jurisdiction values |

---

## Prioritized Actions

### Priority 1 — High Impact (Critical Routes Missing)

#### P1A: Add tests for `GET /events/:id/releases`
- Happy path: event exists + releases returned
- 404 path: event does not exist

#### P1B: Add tests for `DELETE /release/attach/:releaseId`
- Happy path: release detached successfully
- 404 path: release attachment not found

#### P1C: Add tests for `PATCH /release/attach`
- Happy path: update existing attachment
- 404 paths: event not found / release not found

#### P1D: Complete `GET /release/validate/id` test coverage
- 400 path: missing releaseId/eventId/targetEnv params
- 400 path: release not attached to the specified event
- Happy path with explicit releaseTimestamp

#### P1E: Add tests for `GET /releases`
- Returns all registered release attachments

#### P1F: Add tests for `GET /events/search/`
- Happy path with existing event name
- 400 path: missing or empty `name` query param
- 404 path: no releases found for the event

### Priority 2 — Branch Coverage Improvements (~15 uncovered branches in routes.ts)

#### P2A: Add branch tests for validation error paths
All POST/PATCH routes have `safeParse` guards — verify all error scenarios are exercised with specific invalid payloads (e.g., wrong types, max-length strings).

#### P2B: Ensure all error handling catch blocks are covered
Test that thrown errors from repositories bubble up as 500 responses for each route.

#### P2C: Test query parameter coercion in `GET /release/validate/id`
- Default timestamp behavior (when releaseTimestamp not provided)

### Priority 3 — Service Logic Tests

#### P3A: WindowCalculationEngine edge cases
- `event.event_enabled = false` → not enabled
- `event.event_open_for_delivery = false` → not open for delivery
- Null window dates (enabled but no start/end) → valid deployment
- Unknown environment key

#### P3B: EventRepository tests (currently missing dedicated file)
- `create()` generates UUID and saves correctly
- `findById()` returns undefined for non-existent IDs
- `update()` merges partial data (partial update test)

#### P3C: ReleaseRepository tests
- `findByEventName()` case-insensitive search
- `attach()` generates UUID for attachment

#### P3D: ApplicationRepository tests (currently missing dedicated file)
- `createApplication()` generates UUID and saves correctly
- `getAllApplications()` returns empty array

### Priority 4 — Schema/Types Tests

#### P4A: Zod schema validation tests for `src/types.ts`
Create `src/tests/types.test.ts`:

| Test Group | Scenarios |
|-----------|-----------|
| CreateEventSchema | Missing name, empty name, no time_windows, invalid datetime in window |
| UpdateEventSchema | Valid partial update (name only), valid empty object, type change only |
| AttachReleaseSchema | Empty releaseId, invalid UUID for eventId |
| CreateApplicationSchema | Missing name, empty environments, unknown jurisdiction in list |

#### P4B: Integration — schema + route coupling
- Send request with `type_windows.test.start = "invalid-date"` → expect 400
- Send request with `type_windows.test.enabled = "yes"` (string instead of bool) → expect 400

---

## Implementation Order

1. **P1** (6 blocks) — Write route tests first, this covers the largest gap
2. **P3A** (WindowCalculationEngine) — Quick wins, ~15 minutes
3. **P2** (Branch coverage) — Add specific payload tests for validation paths
4. **P3B-D** (Repository unit tests) — Optional, coverage already strong here
5. **P4** (Schema validation tests) — Clean safety net for type changes

## Target Coverage Goals

| Module | Current | Target |
|--------|---------|--------|
| Overall | 82.67% | **90%+** |
| src/api/ | 68.84% | **90%+** |
| src/services/ | 98.87% | **100%** |

## Suggested File Structure

```
src/tests/
├── api.test.ts              # Existing — extend with P1 tests (+ ~20 new tests)
├── WindowCalculationEngine.test.ts   # Extend with P3A (~6-8 new tests)
├── EventRepository.test.ts   # New (P3B, ~8-10 tests)
├── ReleaseRepository.test.ts # Extend with P3C (~6-8 new tests)
├── ApplicationRepository.test.ts  # New (P3D, ~5-6 tests)
└── types.test.ts             # New (P4, ~15-20 tests)
```

## Notes

- **No new test files needed for db/sqlite.ts** — 100% coverage achieved, DB schema is declarative
- **No new test files needed for api/swagger.ts** — swagger config, not executable logic
- **Existing `api.test.ts` already tests most P1 scenarios** via supertest — just extend it
- **Repository unit tests are less critical** since integration tests cover them indirectly, but add for faster feedback