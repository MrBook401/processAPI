# Process Manager API

A process management system API that allows defining deployment windows for future events and linking software releases to these events. 

## Run the Project

1. Install dependencies:
   ```bash
   npm install
   ```
   *(Also run `npm install` inside `src/ui` if you plan to use the dashboard)*

2. Start the API server:
   ```bash
   npm start
   ```
   The API will run on `http://localhost:3001`.

3. Start the UI dashboard (optional):
   ```bash
   cd src/ui
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`.

## API Documentation (Swagger)

The project includes an interactive Swagger API documentation UI. Once the server is running, you can access it by navigating to:
**http://localhost:3001/api-docs**

This interface allows you to view all available endpoints, their expected request/response formats, and even test them directly from your browser.

## API Endpoints & Curl Examples

Below are `curl` commands to interact directly with the API. The base URL is `http://localhost:3001`.

### 1. Create a New Event
Creates a new event with defining windows for TEST, PREPROD, and PROD phases.

```bash
curl -X POST http://localhost:3001/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Quarterly Update Q2",
    "time_windows": {
      "test": { "start": "2026-05-01T00:00:00Z", "end": "2026-05-07T23:59:59Z", "enabled": true },
      "preprod": { "start": "2026-05-08T00:00:00Z", "end": "2026-05-14T23:59:59Z", "enabled": true },
      "prod": { "start": "2026-05-15T00:00:00Z", "end": "2026-05-20T23:59:59Z", "enabled": true }
    },
    "event_enabled": true,
    "event_open_for_delivery": true,
    "type": "standard"
  }'
```

```bash
curl -X POST http://localhost:3001/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Quarterly Update Q2",
    "time_windows": {
      "test": {  "enabled": true },
      "preprod": { "start": "2026-05-08T00:00:00Z", "end": "2026-05-14T23:59:59Z", "enabled": true },
      "prod": { "start": "2026-05-15T00:00:00Z", "end": "2026-05-20T23:59:59Z", "enabled": true }
    },
    "event_enabled": true,
    "event_open_for_delivery": true,
    "type": "standard"
  }'
```

### 2. List All Events
Retrieves a list of all defined events.

```bash
curl -X GET http://localhost:3001/events
```

### 3. Update an Event
Updates specific fields of an existing event. *(Replace `123e4567-e89b-12d3-a456-426614174000` with the actual ID returned from the creation/list step)*

```bash
curl -X PATCH http://localhost:3001/events/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Quarterly Update Q2 - Rescheduled"
  }'
```

### 4. Attach a Release to an Event
Links a specific software release to an event.

```bash
curl -X POST http://localhost:3001/release/attach \
  -H "Content-Type: application/json" \
  -d '{
    "releaseId": "REL-12345",
    "eventId": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

*(To change the event for an existing release, you can send the same payload with a `PATCH` request to `/release/attach`)*

### 5. Validate a Release's Timing
Calculates if the release falls within its attached event's defined time window for the specified target environment. 
A `targetEnv` is required. Optionally, pass a `releaseTimestamp` parameter; otherwise, the current server time is used.

```bash
curl -X GET "http://localhost:3001/release/validate/id?releaseId=REL-12345&eventId=123e4567-e89b-12d3-a456-426614174000&targetEnv=prod&releaseTimestamp=2026-05-10T12:00:00Z"
```

### 6. Create an Application
Creates a new application mapping its supported environments (`dev`, `test`, `preprod`, `prod`) to regional jurisdictions (`APAC`, `CH`, `EMEA`, `US`).

```bash
curl -X POST http://localhost:3001/applications \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Core Banking API",
    "environments": {
      "dev": ["CH"],
      "test": ["CH", "EMEA"],
      "preprod": ["CH", "EMEA", "US"],
      "prod": ["APAC", "CH", "EMEA", "US"]
    }
  }'
```

### 7. List All Applications
Retrieves a list of all defined applications and their environment configurations.

```bash
curl -X GET http://localhost:3001/applications
```
