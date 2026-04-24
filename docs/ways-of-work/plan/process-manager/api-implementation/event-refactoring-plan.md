# Event Refactoring Implementation Plan

## Goal
Refactor the `EVENT` entity across the codebase to use a new schema. This involves consolidating the individual window columns (`test_window`, `preprod_window`, `prod_window`) into a single `time_windows` JSON column, adding `event_enabled`, `event_open_for_delivery`, and `type`, and ensuring all layers (DB, API, Services, Tests, and Frontend) support the new structure. Data migration is not required as the database will be recreated.

## New Schema Definition
```sql
EVENT {
    TEXT id PK
    TEXT name
    TEXT time_windows 
    TEXT created_at
    BOOL event_enabled
    BOOL event_open_for_delivery
    TEXT type 
}
```
*Note: `time_windows` will store JSON text mapping the environment (`test`, `preprod`, `prod`) to valid time windows (start time, end time, and enabled flag).*

## Implementation Steps

### 1. Database Schema Update (`src/db/sqlite.ts`)
- Update the `CREATE TABLE IF NOT EXISTS event` statement in `initializeSchema`.
- Remove old columns: `enabled`, `open_for_release`, `test_start`, `test_end`, `test_enabled`, `preprod_start`, `preprod_end`, `preprod_enabled`, `prod_start`, `prod_end`, `prod_enabled`.
- Add new columns: `time_windows` (TEXT), `event_enabled` (BOOLEAN DEFAULT 1), `event_open_for_delivery` (BOOLEAN DEFAULT 1), `type` (TEXT).
- Provide instruction to delete `database.sqlite` locally to allow recreation.

### 2. Type Definitions Update (`src/types.ts`)
- Refactor `EventSchema` to match the new DB schema:
  - Add `created_at` (string datetime).
  - Add `event_enabled` (boolean).
  - Add `event_open_for_delivery` (boolean).
  - Add `type` (string).
  - Replace `test_window`, `preprod_window`, and `prod_window` with `time_windows`: `z.record(z.enum(['test', 'preprod', 'prod']), TimeWindowSchema)`.
- Update `CreateEventSchema` and `UpdateEventSchema` to use the new fields (`time_windows`, `event_enabled`, `event_open_for_delivery`, `type`).

### 3. Event Repository Update (`src/services/EventRepository.ts`)
- **`mapRowToEvent`**: 
  - Parse `row.time_windows` using `JSON.parse`.
  - Map `row.event_enabled`, `row.event_open_for_delivery`, `row.type`, and `row.created_at`.
- **`create`**: 
  - Update the `INSERT INTO` query and parameters to insert `time_windows` as a JSON string (`JSON.stringify(data.time_windows)`).
  - Include the new fields `event_enabled`, `event_open_for_delivery`, and `type`.
- **`update`**: 
  - Update the `UPDATE event SET` query and parameters to serialize `time_windows` and update the new fields.

### 4. Window Calculation Engine Update (`src/services/WindowCalculationEngine.ts`)
- Modify `validateTiming` to access `event.time_windows[targetEnv.toLowerCase()]` instead of accessing `event.test_window` directly.
- Add logic to handle `event.event_enabled` or `event.event_open_for_delivery` where relevant to validation rules.

### 5. API Swagger Update (`src/api/swagger.ts`)
- Update the OpenAPI definition for the `Event` schema:
  - Add `event_enabled`, `event_open_for_delivery`, `type`, `created_at`.
  - Replace explicit window properties with a `time_windows` property (object type mapping to `TimeWindow`).
- Apply the same updates to `CreateEvent` and `UpdateEvent` schema documentation.

### 6. Tests Update (`src/tests/*`)
- **`src/tests/api.test.ts`**: Update event creation payloads in tests to use the `time_windows` object and include `type`. Update assertions that check window attributes.
- **`src/tests/WindowCalculationEngine.test.ts` & `src/tests/DisabledWindowCalculationEngine.test.ts`**: Update the mocked `Event` objects to match the new `Event` type format (`time_windows` record, `event_enabled`, etc.).

### 7. Frontend Updates (`src/ui/src/lib/api/client.ts` & `src/ui/src/app/page.tsx`)
- **`client.ts`**: 
  - Update `ProcessEvent` interface to use `time_windows: Record<'test' | 'preprod' | 'prod', TimeWindow>`.
  - Add `event_enabled`, `event_open_for_delivery`, `type`, and `created_at` to the interface.
- **`page.tsx`**:
  - Update the "Create Event" form state (`newEvent`) to initialize with `type` and an appropriate structure for `time_windows`.
  - Adjust the form UI to allow inputs for the new fields if desired (or just send defaults for now).
  - Update the table rendering to read window statuses and dates from `evt.time_windows.test`, etc., instead of `evt.test_window`.

### 8. Final Verification
- Restart the backend to recreate the SQLite database.
- Run `npm test` to verify all tests pass.
- Start the frontend and verify event creation and rendering.