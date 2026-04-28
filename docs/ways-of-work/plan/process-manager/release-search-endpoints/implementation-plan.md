---
title: Implementation Plan - Release Search Endpoints
version: 1.0
date_created: 2026-04-28
status: Draft
---

# Implementation Plan: Release Search Endpoints

## Goal

Add two new API endpoints to expose release data from the `release_attachment` table:
1. **Retrieve all releases** — a global endpoint returning every row in `release_attachment`.
2. **Search releases by event name** — returns all release attachments linked to a specific event, where the lookup is done by the event's **name** (not UUID).

## Requirements

| # | Requirement |
|---|-------------|
| REQ-001 | `GET /releases` returns all release attachments with their associated event details. |
| REQ-002 | `GET /events/search/releases?name=<event_name>` returns all releases attached to the event whose name matches (case-insensitive partial match). |
| REQ-003 | Both endpoints return `404` when no releases are found for the given event name. |
| REQ-004 | Both endpoints return `500` on database errors. |

> **Note**: REQ-001 returns the raw `ReleaseAttachment` objects (no event details joined) since the spec only defines searching by event name, not "enriching" results with event data.

## Technical Design

### 1. Database Layer — ReleaseRepository (src/services/ReleaseRepository.ts)

Add two new methods to `ReleaseRepository`:

```typescript
// Returns ALL rows from release_attachment
findAll(): ReleaseAttachment[];

// Finds all attachments for an event by name (JOIN with event table)
findByEventName(eventName: string): ReleaseAttachment[];
```

**Implementation details:**

| Method | SQL | Notes |
|--------|-----|-------|
| `findAll()` | `SELECT * FROM release_attachment ORDER BY attached_at DESC` | Simple SELECT, no filtering. |
| `findByEventName(eventName)` | `SELECT r.* FROM release_attachment r JOIN event e ON r.event_id = e.id WHERE LOWER(e.name) LIKE LOWER(?) ORDER BY r.attached_at DESC` | Case-insensitive partial match via `LIKE '%<search_term>%'`. |

### 2. API Routes (src/api/routes.ts)

Add two new route handlers:

```typescript
// GET /releases — list all releases
routes.get('/releases', (req, res) => {
  try {
    const releases = releaseRepo.findAll();
    res.status(200).json(releases);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /events/search/releases — search releases by event name
routes.get('/events/search/releases', (req, res) => {
  const { name } = req.query;

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Missing or empty "name" query parameter' });
  }

  try {
    const releases = releaseRepo.findByEventName(name.trim());
    if (releases.length === 0) {
      return res.status(404).json({ error: 'No releases found for event' });
    }
    res.status(200).json(releases);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
```

### 3. OpenAPI / Swagger Annotations

Add `@openapi` documentation blocks above each new route, following the existing pattern:

**GET /releases**
```openapi
 * @openapi
 * /releases:
 *   get:
 *     summary: Retrieve all releases from attachment table
 *     responses:
 *       200:
 *         description: A list of all release attachments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ReleaseAttachment'
```

**GET /events/search/releases**
```openapi
 * @openapi
 * /events/search/releases:
 *   get:
 *     summary: Retrieve releases linked to an event by name
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Event name (case-insensitive partial match)
 *     responses:
 *       200:
 *         description: A list of release attachments for the event
 *       400:
 *         description: Missing or empty name parameter
 *       404:
 *         description: No releases found for event
```

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/services/ReleaseRepository.ts` | Modify | Add `findAll()` and `findByEventName(eventName)` methods |
| `src/api/routes.ts` | Modify | Add two new route handlers with OpenAPI annotations |

## Files NOT modified
- `src/types.ts` — existing `ReleaseAttachment` type and schema are sufficient.
- `src/db/sqlite.ts` — existing schema supports the queries; no new tables needed.
- `src/ui/` — UI changes are out of scope for this plan.

## Edge Cases & Considerations

1. **Empty event name** — return `400` with descriptive error message (handled in route).
2. **No matching event name** — return `404` with "No releases found for event" (handled in route).
3. **SQL injection** — uses parameterized queries throughout (`?` placeholders), so no SQL injection risk.
4. **Null event_id** — the `release_attachment` table allows NULL `event_id`. The JOIN in `findByEventName` naturally excludes these rows.
5. **Multiple events with same name** — the `JOIN` + `LIKE` will return releases for ALL matching event names. This is consistent with the "partial match" requirement.
6. **Performance** — for large datasets, consider adding an index on `event.name`. This can be deferred to a future iteration.

## Testing Strategy

Follow existing patterns in `src/tests/ReleaseRepository.test.ts`:

| Test | Level | Description |
|------|-------|-------------|
| `findAll() returns all attachments` | Unit | Verify repository method returns correct data. |
| `findByEventName() matches case-insensitively` | Unit | Verify lowercase/uppercase search works. |
| `findByEventName() partial match` | Unit | Verify "Quarterly" matches "Quarterly Update Q2". |
| `findByEventName() returns empty for non-matching` | Unit | Verify no false positives. |
| `GET /releases returns all releases` | Integration | End-to-end endpoint test. |
| `GET /events/search/releases?name=test` returns matching releases | Integration | End-to-end endpoint test. |
| `GET /events/search/releases?name=` returns 400 | Integration | Bad parameter test. |

## Implementation Order

1. [ ] Add `findAll()` method to ReleaseRepository
2. [ ] Add `findByEventName(eventName)` method to ReleaseRepository (with JOIN)
3. [ ] Add unit tests for both repository methods
4. [ ] Add `GET /releases` route handler with OpenAPI annotations
5. [ ] Add `GET /events/search/releases` route handler with OpenAPI annotations
6. [ ] Add integration tests for both endpoints
7. [ ] Update swagger documentation
8. [ ] Run full test suite to confirm no regressions