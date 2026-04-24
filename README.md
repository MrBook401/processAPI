# Process Manager

## Project Name and Description

**Process Manager** is a system designed to facilitate the creation of "release plans" by defining future events with associated time windows for different release phases (TEST, PREPROD, PROD). It allows Release Managers to define deployment schedules and Development Teams to link software releases to these events for validation. The system verifies if a given release's timing aligns with the predefined event windows. Additionally, it provides application management functionality to configure applications with specific environment and jurisdiction mappings.

## Technology Stack

The project operates as a monolithic repository containing both a Node.js backend and a Next.js frontend, primarily written in TypeScript.

### Runtime Summary
- **Primary Language**: TypeScript
- **Runtime**: Node.js v20
- **Package Manager**: npm
- **Module System**: CommonJS (Backend), Next.js App Router (Frontend)

### Production Frameworks & Dependencies
- **Backend**:
  - Express (^5.2.1) - REST API server
  - SQLite3 (^6.0.1) - Database engine
  - Zod (^4.3.6) - Schema validation
  - date-fns (^4.1.0) - Date parsing and manipulation
- **Frontend**:
  - Next.js (16.2.4) - React framework
  - React (19.2.4) - UI rendering
  - Tailwind CSS / shadcn (^4.4.0) - Styling and UI components
  - Zustand (^5.0.12) - State management

### Development Toolchain
- **Testing**: Jest (^30.3.0), ts-jest, supertest (^7.2.2)
- **Linting**: ESLint (Frontend)
- **Typing**: TypeScript with `strict: true`

## Project Architecture

The application is split between a Layered Architecture backend and a React-based Next.js frontend.

### System Flow
```text
HTTP Request -> src/api/routes.ts -> src/services/[Service|Repo].ts -> src/db/sqlite.ts -> SQLite -> HTTP Response
```

### Layer Responsibilities
- **API (`src/api/`)**: Handles HTTP requests, routing, and schema validation via Zod. Must not contain business logic or DB queries.
- **Services (`src/services/`)**: Contains core business logic (e.g., `WindowCalculationEngine.ts`) and Repository Pattern implementations for data access.
- **Database (`src/db/`)**: Manages the SQLite database connection and initialization.
- **Frontend (`src/ui/`)**: React components and API client for user interaction.

## Getting Started

### Prerequisites
- Node.js v20+
- npm

### Installation & Setup

1. **Install backend dependencies:**
   ```bash
   npm install
   ```
2. **Install frontend dependencies:**
   ```bash
   cd src/ui
   npm install
   ```

### Running the Application

1. **Start the backend development server:**
   ```bash
   npm run dev
   ```
2. **Start the frontend development server:**
   ```bash
   cd src/ui
   npm run dev
   ```

## Project Structure

```text
├── docs/       # Project documentation, architecture, and coding standards
├── spec/       # Technical specifications and API designs
├── src/        # Backend source code
│   ├── api/      # Express application setup, routes, and Swagger
│   ├── db/       # SQLite database configuration
│   ├── services/ # Business logic and database repositories
│   ├── tests/    # Backend unit and integration tests
│   └── ui/       # Next.js frontend application
```

## Key Features

- **Event Management**: Create, retrieve, and update scheduled events with defined TEST, PREPROD, and PROD time windows.
- **Release Attachment**: Link unique release IDs to specific events.
- **Release Validation**: Automatically validate if a release falls within the allowed deployment windows for a given event.
- **Application Configuration**: Configure applications across multiple environments (`dev`, `test`, `preprod`, `prod`) and geographical jurisdictions (`APAC`, `CH`, `EMEA`, `US`).

## Development Workflow

- The codebase relies on standard GitHub/GitLab pull requests.
- Backend logic strictly adheres to layer isolation (Routes -> Services -> DB).
- Complex business rules (like time window validation) are centralized in distinct engine files (e.g., `WindowCalculationEngine.ts`) and thoroughly tested.

## Coding Standards

### Naming Conventions
- **Files**: `PascalCase` for Services, Repositories, and Types (e.g., `EventRepository.ts`). `camelCase` or `kebab-case` for others.
- **Functions/Methods**: `camelCase`
- **Types/Interfaces**: `PascalCase`
- **Constants**: `PascalCase` for schemas (e.g., `TimeWindowSchema`); `UPPER_SNAKE_CASE` for environment variables.

### Imports & Formatting
- Use relative imports without barrel files (e.g., avoid `index.ts` re-exports in services).
- Frontend formatting and linting are enforced by ESLint. Run `npm run lint` within `src/ui/` to verify.

## Testing

The project uses **Jest** with `ts-jest` for backend testing.
- **Unit Tests**: Target `src/services/` to validate business logic independently.
- **Integration Tests**: Target API routes and the DB using `supertest`.
- **Requirements**: >80% overall API test coverage and 100% test coverage on core validation logic.

### Running Tests
```bash
npm run test
```

## Contributing

1. Review the architecture (`docs/codebase/ARCHITECTURE.md`) and coding standards (`docs/codebase/CONVENTIONS.md`) before contributing.
2. Ensure you follow layer boundaries (no direct DB calls in route handlers).
3. Any new business logic must include corresponding unit tests.
4. Verify all tests pass by running `npm run test`.
