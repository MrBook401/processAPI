# ProcessAPI Usage Guide

Base URL: `http://localhost:${process.env.PORT || 3001}` (default)

## Table of Contents
- [Event Management](#event-management)
  - [Create Event](#create-event)
  - [List Events](#list-events)
  - [Update Event](#update-event)
- [Release Management](#release-management)
  - [Attach Release to Event](#attach-release-to-event)
  - [Update Release Attachment](#update-release-attachment)
  - [List Releases for Event (by ID)](#list-releases-for-event-by-id)
  - [List Releases for Event (by Name)](#list-releases-for-event-by-name)
  - [List All Releases](#list-all-releases)
  - [Detach Release from Event](#detach-release-from-event)
- [Release Validation](#release-validation)
  - [Validate Release Timing (by ID)](#validate-release-timing-by-id)
- [Application Management](#application-management)
  - [Create Application](#create-application)
  - [List Applications](#list-applications)

---

## Event Management

### Create Event

Create a new event with time windows for each environment.

```bash
curl -X POST http://localhost:3001/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Black Friday Sale",
    "time_windows": {
      "test": {
        "start": "2026-05-01T00:00:00.000Z",
        "end": "2026-05-15T23:59:59.999Z",
        "enabled": true
      },
      "preprod": {
        "start": "2026-05-16T00:00:00.000Z",
        "end": "2026-05-31T23:59:59.999Z",
        "enabled": true
      },
      "prod": {
        "start": "2026-06-01T00:00:00.000Z",
        "end": "2026-06-30T23:59:59.999Z",
        "enabled": false
      }
    },
    "event_enabled": true,
    "event_open_for_delivery": true,
    "type": "standard"
  }'
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Black Friday Sale",
  "time_windows": { ... },
  "created_at": "2026-04-28T17:53:00.000Z",
  "event_enabled": true,
  "event_open_for_delivery": true,
  "type": "standard"
}
```

### List Events

Retrieve all events.

```bash
curl http://localhost:3001/events
```

**Response (200):**
```json
[
  { "id": "...", "name": "Black Friday Sale", ... },
  { "id": "...", "name": "Spring Campaign", ... }
]
```

### Update Event

Partially update an existing event by ID.

```bash
curl -X PATCH http://localhost:3001/events/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "event_open_for_delivery": false,
    "time_windows": {
      "prod": {
        "start": null,
        "end": null,
        "enabled": true
      }
    }
  }'
```

**Response (200):** Updated event object.
**Response (404):** Event not found.

---

## Release Management

### Attach Release to Event

Attach a release artifact (e.g., build, image tag) to an event.

```bash
curl -X POST http://localhost:3001/release/attach \
  -H "Content-Type: application/json" \
  -d '{
    "releaseId": "v2.41.0-rc3",
    "eventId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Response (201):**
```json
{
  "id": "<generated-id>",
  "releaseId": "v2.41.0-rc3",
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "attachedAt": "2026-04-28T17:53:00.000Z"
}
```

### Update Release Attachment

Re-attach an existing release to a different event (upsert).

```bash
curl -X PATCH http://localhost:3001/release/attach \
  -H "Content-Type: application/json" \
  -d '{
    "releaseId": "v2.41.0-rc3",
    "eventId": "another-event-id-here"
  }'
```

### List Releases for Event (by ID)

Retrieve all releases attached to a specific event identified by UUID.

```bash
curl http://localhost:3001/events/550e8400-e29b-41d4-a716-446655440000/releases
```

### List Releases for Event (by Name)

Retrieve all releases attached to an event matched by name (case-insensitive partial match).

```bash
curl "http://localhost:3001/events/search/releases?name=Black+Friday"
```

**Response (200):**
```json
[
  { "id": "...", "releaseId": "v2.41.0-rc3", ... },
  { "id": "...", "releaseId": "v2.40.1-hotfix", ... }
]
```

### List All Releases

Retrieve all release attachments across all events.

```bash
curl http://localhost:3001/releases
```

### Detach Release from Event

Remove a release attachment.

```bash
curl -X DELETE http://localhost:3001/release/attach/<attachment-id>
```

**Response (200):** `{"message": "Successfully detached release"}`

---

## Release Validation

### Validate Release Timing (by ID)

Check whether a release can be deployed to an environment at a given time based on the event's time windows.

```bash
curl "http://localhost:3001/release/validate/id?releaseId=v2.41.0-rc3&eventId=550e8400-e29b-41d4-a716-446655440000&releaseTimestamp=2026-06-10T14:30:00.000Z&targetEnv=prod"
```

**Response (200):**
```json
{
  "isValid": true,
  "phase": "PROD",
  "message": "Release can be deployed to PROD"
}
```

---

## Application Management

### Create Application

Register a new application with its environments and jurisdictions.

```bash
curl -X POST http://localhost:3001/applications \
  -H "Content-Type: application/json" \
  -d '{
    "name": "checkout-service",
    "environments": {
      "dev": ["GLOBAL"],
      "test": ["APAC", "US", "EMEA"],
      "preprod": ["APAC", "US", "EMEA"],
      "prod": ["CH", "EMEA"]
    }
  }'
```

**Response (201):** Created application object.

### List Applications

Retrieve all registered applications.

```bash
curl http://localhost:3001/applications
```

**Response (200):**
```json
[
  { "id": "...", "name": "checkout-service", ... }
]
```

## Error Responses

| Status | Meaning |
|--------|---------|
| 400 | Invalid request body or missing parameters |
| 404 | Resource not found (event, release, attachment) |
| 500 | Internal server error |

Error responses follow a consistent format:
```json
{ "error": "Event not found" }
```

Validation errors include details:
```json
{ "error": "Invalid payload", "details": [{ "path": ["name"], "message": "..."}] }