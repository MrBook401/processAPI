# Implementation Plan: Release Attachment Freeze Period

## Overview
Prevent release attachment to events when the current date falls within a configurable freeze period prior to the PROD start date. This applies to both `POST /release/attach` and `PATCH /release/attach` endpoints.

## Problem Statement
Teams may attempt to attach releases close to the PROD window (e.g., during a maintenance freeze), which can violate change management policies. A configurable number of days (default: 1) before the PROD start date should block release attachments.

## Design Decisions
- Freeze period is an event-level field (`freeze_days_before_prod`), stored in the `event` table
- The freeze period is calculated from the PROD time window's start date, not a separate field
- Default value: 1 day (86400 seconds) when not explicitly set on an event
- Only the PROD window is used for freeze period calculation (TEST/PREPROD windows are not relevant)
- The check happens at attachment time (current date vs freeze window), not at release deploy validation time

## Requirements

### Functional
- Add `freeze_days_before_prod` field to Event model (default: 1)
- Before attaching a release via POST or PATCH `/release/attach`, check if current date falls within the freeze period
- If within freeze period, reject with HTTP 403 (Forbidden) response body indicates the release cannot be attached

### API Behavior
- `POST /release/attach` — reject mid-flight if freeze period active
- `PATCH /release/attach` — reject mid-flight if freeze period active (when updating an existing attachment to a new event whose PROD window is within the freeze period)

### Validation Flow
- Only check against the target event's PROD window (not all events)
- Use current server time (`new Date()`) for comparison
- The freeze period starts `freeze_days_before_prod` days before the PROD window's start date and ends at the PROD window's start date (exclusive — attachments are allowed on or after the PROD start)

### Response
- HTTP status: `403` (Forbidden — as specified in the task)
- Response body: `{ error: "Cannot attach release within freeze period of event. Freeze window is from {freezeStart} to {freezeEnd}." }`

### Edge Cases
1. Event has no PROD window → skip freeze check (no reference point)
2. PROD window start is null → skip freeze check (open-ended window, no reference point)
3. `freeze_days_before_prod` is not set on an event → use default of 1 day
4. TODAY equals PROD start date → allow (freeze period is exclusive at the end)

### Database
- Add `freeze_days_before_prod` column to `event` table (INTEGER, default 1)

### Types
- Add `freeze_days_before_prod?: number` to `CreateEventSchema` and `UpdateEventSchema`
- Add `freeze_days_before_prod: number` to the `Event` type

## Files to Modify
- `src/types.ts` - Add freeze_days_before_prod field and schema
- `src/db/sqlite.ts` - Add column to event table schema
- `src/services/EventRepository.ts` - Persist and read the new field (create, update)
- `src/services/ReleaseRepository.ts` - Add freeze period check method (or add to a shared service)
- `src/api/routes.ts` - Call freeze check in POST and PATCH `/release/attach`
- `src/api/swagger.ts` - Add freeze_days_before_prod to Event/OpenAPI schemas
- `src/tests/api.test.ts` - New tests for freeze period behavior
- `src/db/sqlite.ts` (seed or migration) - Add default value for existing rows

## EventRepository Changes
- `create()`: include freeze_days_before_prod in INSERT (default to 1 if not provided)
- `update()`: include freeze_days_before_prod in UPDATE (merge with existing value if not provided)
- `mapRowToEvent()`: map the new column to the event object

## Freeze Period Check Logic
The freeze check determines whether today (server date) falls within the freeze window:

```ts
const prodStart = parseISO(event.time_windows.prod.start);
if (!prodStart || isNaN(prodStart.getTime())) return null; // no freeze check

const freezeDays = (event.freeze_days_before_prod ?? 1);
const freezeStart = subDays(prodStart, freezeDays); // from {freezeStart} to {prodStart-1 day 23:59:59}

return isWithinInterval(new Date(), { start: freezeStart, end: subDays(prodStart, 1) });
```

## Test Plan
### Unit Tests (new file or add to existing tests):
1. Freeze period check returns true when today is within the freeze window (e.g., 0.5 days before PROD)
2. Freeze period check returns false when today is exactly the PROD start date (allowed)
3. Freeze period check returns false when today is after PROD start
4. Freeze period check uses default of 1 day when `freeze_days_before_prod` is not set
5. Freeze period check skips when PROD start is null
6. Freeze period check skips when event has no PROD window (all windows disabled or missing)

### API Tests (add to api.test.ts):
1. POST /release/attach returns 403 when freeze period is active (PROD in X days)
2. POST /release/attach succeeds when freeze period has not started (PROD in 5 days, freeze is 1)
3. POST /release/attach succeeds when today equals PROD start date
4. PATCH /release/attach returns 403 when attaching to an event in freeze period
5. PATCH /release/attach succeeds when not in freeze period of target event
6. POST /release/attach with null PROD window succeeds (no freeze check)

## API Documentation Updates
- Update Swagger/OpenAPI docs to include `freeze_days_before_prod` field on Event schemas (CreateEvent, UpdateEvent, Event)
- Document the new 403 response on POST and PATCH `/release/attach`

## Implementation Phases
1. **Types & Schema** — Add `freeze_days_before_prod` to types and DB schema
2. **Repository Layer** — Update EventRepository to persist/read the field; add freeze check helper
3. **API Layer** — Add freeze check to POST and PATCH `/release/attach` routes
4. **Tests** — Write unit and API tests for freeze period logic
5. **Docs** — Update Swagger/OpenAPI schemas