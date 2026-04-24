# Technology Stack

## Core Sections (Required)

### 1) Runtime Summary

| Area | Value | Evidence |
|------|-------|----------|
| Primary language | TypeScript | `package.json`, `src/ui/package.json` |
| Runtime + version | Node.js v20 | `Dockerfile` |
| Package manager | npm | `package-lock.json`, `src/ui/package-lock.json` |
| Module/build system | CommonJS (backend), Next.js App Router (frontend) | `tsconfig.json`, `src/ui/package.json` |

### 2) Production Frameworks and Dependencies

| Dependency | Version | Role in system | Evidence |
|------------|---------|----------------|----------|
| Express | ^5.2.1 | Backend REST API server | `package.json` |
| SQLite / sqlite3 | ^5.1.1 / ^6.0.1 | Database engine | `package.json` |
| Zod | ^4.3.6 | Schema validation | `package.json` |
| date-fns | ^4.1.0 | Date parsing and manipulation | `package.json` |
| Next.js | 16.2.4 | Frontend UI framework | `src/ui/package.json` |
| React | 19.2.4 | Frontend UI rendering | `src/ui/package.json` |
| Tailwind CSS / shadcn | ^4.x / ^4.4.0 | UI styling and components | `src/ui/package.json` |
| Zustand | ^5.0.12 | Frontend state management | `src/ui/package.json` |

### 3) Development Toolchain

| Tool | Purpose | Evidence |
|------|---------|----------|
| TypeScript | Compilation and type checking | `package.json`, `src/ui/package.json` |
| Jest / ts-jest | Backend unit/integration tests | `package.json` |
| ESLint | Frontend linting | `src/ui/package.json` |

### 4) Key Commands

```bash
npm install # install root dependencies
cd src/ui && npm install # install ui dependencies
npm run build # build backend
npm run test # run jest for backend
npm run dev # start backend development server
```

### 5) Environment and Config

- Config sources: `tsconfig.json`, `jest.config.js`, `src/ui/next.config.ts`
- Required env vars: [TODO] No explicitly required variables found.
- Deployment/runtime constraints: Deployed via Docker where frontend and backend are run inside the same container.

### 6) Evidence

- `package.json`
- `src/ui/package.json`
- `Dockerfile`
- `tsconfig.json`