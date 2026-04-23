---
title: Process Manager API Specification
version: 1.0
date_created: 2026-04-23
tags: [api, design, process-management]
---

# Introduction

This specification defines the requirements and interface for the Process Manager API. The primary goal is to facilitate the creation of "release plans" by defining future events with associated time windows for different release phases (TEST, PREPROD, PROD) and allowing software releases to be linked to these events for validation.

## 1. Purpose & Scope

The Process Manager API provides a mechanism for:
- **Release Managers** to define the schedule of events and the permissible time windows for deployment across environments.
- **Development Teams** to associate specific release artifacts (via Release IDs) with these scheduled events.
- **System Validation** to verify if a given release's timing aligns with the predefined event windows.

The scope is limited to the API definition and business logic for window validation. It does not cover the actual deployment orchestration or the internal lifecycle of the releases themselves.

## 2. Definitions

| Term | Definition |
| :--- | :--- |
| **Event** | A scheduled future occurrence (e.g., a project milestone or maintenance window) that requires a release. |
| **Release Plan** | The collection of all defined events and their associated time windows. |
| **Time Window** | A specific start and end timestamp defining when a release phase is permissible. |
| **TEST Window** | The allowed period for deploying to the Test environment. |
| **PREPROD Window** | The allowed period for deploying to the Pre-production environment. |
| **PROD Window** | The allowed period for deploying to the Production environment. |
| **Release ID** | A unique identifier for a specific version of the software being released. |
| **Application** | A software system managed by the Process Manager, containing environment and jurisdiction configurations. |
| **Environment** | A specific deployment stage for an application. Supported environments are `dev`, `test`, `preprod`, and `prod`. |
| **Jurisdiction** | A geographic or regulatory region where an application can be enabled. Supported jurisdictions are `APAC`, `CH`, `EMEA`, and `US`. |

## 3. Requirements, Constraints & Guidelines

### Functional Requirements
- **REQ-001**: The system shall allow the creation, retrieval, and modification of Events via the `/events/` endpoint.
- **REQ-002**: Each Event must support the definition of three distinct time windows: TEST, PREPROD, and PROD.
- **REQ-003**: The system shall allow the attachment of a `releaseID` to an Event via the `/release/attach/` endpoint.
- **REQ-004**: The system shall provide a validation mechanism to determine if a release (associated with an event) falls within that event's defined time windows.
- **REQ-005**: The system shall allow the creation and retrieval of Applications via the `/applications/` endpoint.
- **REQ-006**: Each Application must be able to specify a list of enabled Jurisdictions ("APAC", "CH", "EMEA", "US") per Environment ("dev", "test", "preprod", "prod").

### Constraints
- **CON-001**: Time windows must be defined as UTC timestamps to avoid timezone ambiguity.
- **CON-002**: A release can only be attached to an event if the `releaseID` is provided and valid.

### Guidelines
- **GUD-001**: API responses should follow standard HTTP status codes (e.g., 201 Created, 400 Bad Request, 404 Not Found).
- **PAT-001**: Use JSON as the primary data exchange format.

## 4. Interfaces & Data Contracts

### 4.1 Event Management (`/events/`)

#### POST `/events/`
Creates a new event in the release plan.
**Request Body:**
```json
{
  "name": "Quarterly Update Q2",
  "test_window": { "start": "2026-05-01T00:00:00Z", "end": "2026-05-07T23:59:59Z" },
  "preprod_window": { "start": "2026-05-08T00:00:00Z", "end": "2026-05-14T23:59:59Z" },
  "prod_window": { "start": "2026-05-15T00:00:00Z", "end": "2026-05-20T23:59:59Z" }
}
```
**Response:** `201 Created` with the created Event object including a generated `eventId`.

#### GET `/events/`
Retrieves a list of all scheduled events.
**Response:** `200 OK` with an array of Event objects.

#### PATCH `/events/{eventId}`
Updates specific fields of an existing event (e.g., shifting a time window).
**Request Body:** Partial Event object.
**Response:** `200 OK` or `404 Not Found`.

### 4.2 Release Attachment (`/release/attach/`)

#### POST `/release/attach/`
Links a release ID to a specific event.
**Request Body:**
```json
{
  "releaseId": "REL-12345",
  "eventId": "EVT-987"
}
```
**Response:** `201 Created`.

#### PATCH `/release/attach/`
Updates the event association for a specific release.
**Request Body:**
```json
{
  "releaseId": "REL-12345",
  "eventId": "EVT-988"
}
```
**Response:** `200 OK`.

### 4.3 Release Validation (`/release/validate/id`)

#### GET `/release/validate/id?releaseId={id}&eventId={id}`
Calculates if the release is within the event's time windows.
*Assumption: The system retrieves the release timestamp from an internal registry or expects a timestamp in the query.*
**Response:**
```json
{
  "isValid": true,
  "phase": "PROD",
  "message": "Release REL-12345 is within the PROD window for event EVT-987."
}
```

### 4.4 Application Management (`/applications/`)

#### POST `/applications/`
Creates a new application with jurisdiction mappings for each environment.
**Request Body:**
```json
{
  "name": "Payment Gateway",
  "environments": {
    "dev": ["APAC", "US", "CH", "EMEA"],
    "test": ["APAC", "US"],
    "preprod": ["US"],
    "prod": ["US"]
  }
}
```
**Constraints:**
- Supported environments: `dev`, `test`, `preprod`, `prod`.
- Supported jurisdictions: `APAC`, `CH`, `EMEA`, `US`.
- Each environment can have 0 or more valid jurisdictions.

**Response:** `201 Created` with the created Application object including a generated `applicationId`.

#### GET `/applications/`
Retrieves a list of all configured applications.
**Response:** `200 OK` with an array of Application objects.

## 5. Acceptance Criteria

- **AC-001**: Given a valid event payload, When `POST /events/` is called, Then the event is persisted and can be retrieved via `GET /events/`.
- **AC-002**: Given an existing event and a release ID, When `POST /release/attach/` is called, Then the link between the release and the event is established.
- **AC-003**: Given a release attached to an event with defined windows, When `GET /release/validate/id` is called:
    - If the current time (or release timestamp) falls within any of the three windows, Then `isValid` should be `true`.
    - Otherwise, Then `isValid` should be `false`.
- **AC-004**: Given a valid application payload with environment and jurisdiction mappings, When `POST /applications/` is called, Then the application configuration is persisted and can be retrieved via `GET /applications/`.

## 6. Test Automation Strategy

- **Test Levels**: 
    - Unit Tests for window calculation logic (inclusive/exclusive boundaries).
    - Integration Tests for API endpoint connectivity and database persistence.
    - E2E Tests covering the flow: Create Event $\rightarrow$ Attach Release $\rightarrow$ Validate Release.
- **Coverage Requirements**: 100% coverage of validation logic; >80% overall API coverage.

## 7. Rationale & Context

The separation between event definition (Release Managers) and release attachment (Developers) ensures that the deployment schedule is controlled by management while allowing developers to trigger the technical linking process. The explicit window check prevents premature or overdue deployments into production environments.

## 8. Dependencies & External Integrations

### Data Dependencies
- **DAT-001**: Release Registry - An external source or database providing the timestamp of when a `releaseId` was created/finalized for validation purposes.

### Technology Platform Dependencies
- **PLT-001**: REST API framework (e.g., FastAPI, Spring Boot, or Express) and a persistent data store (SQL or NoSQL).

## 9. Examples & Edge Cases

### Edge Case: Window Overlap
If windows overlap (e.g., TEST end is same as PREPROD start), the validation logic should prioritize the earliest phase or mark it as valid for both.

### Example: Invalid Validation
**Request**: `GET /release/validate/id?releaseId=REL-1&eventId=EVT-1`
**Context**: Release timestamp is 2026-04-01, but TEST window starts 2026-05-01.
**Response**:
```json
{
  "isValid": false,
  "phase": null,
  "message": "Release REL-1 was created before the earliest allowed window (TEST) starting at 2026-05-01."
}
```

## 10. Validation Criteria

- All endpoints defined in Section 4 are implemented and return correct HTTP status codes.
- The validation logic correctly identifies releases inside and outside of TEST, PREPROD, and PROD windows.
- Database integrity is maintained (e.g., cannot attach a release to a non-existent event).
