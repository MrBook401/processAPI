# SQLite Offline Migration Plan (sqlite3 → sqlite3-offline-next)

## Objective

Replace the native `sqlite3` Node.js binding with `sqlite3-offline-next`, enabling offline-first database operations, removing native compilation dependencies (node-gyp), and supporting applications that function without external network services by bundling SQLite as a precompiled WASM binary.

## Current State Analysis

### Files Involved
| File | Purpose | sqlite3 Usage |
|------|---------|---------------|
| `src/db/sqlite.ts` | Database connection & schema initialization | Imports and uses `sqlite3` driver, calls `open()` with driver reference |
| `src/index.ts` | Application entry point | Imports `getDb()` from sqlite module |
| `src/services/ReleaseRepository.ts` | Release data persistence | Imports `getDb()` indirectly |
| `src/services/EventRepository.ts` | Event data persistence | Imports `getDb()` indirectly |
| `src/services/ApplicationRepository.ts` | Application data persistence | Imports `getDb()` indirectly |
| `src/tests/api.test.ts` | API integration tests | Imports `getDb`, `closeDb` for test setup/teardown |
| `src/tests/ApplicationRepository.test.ts` | Repository tests | Imports `getDb`, `closeDb` for test setup/teardown |
| `src/tests/EventRepository.test.ts` | Repository tests | Imports `getDb`, `closeDb` for test setup/teardown |
| `src/tests/ReleaseRepository.test.ts` | Repository tests | Imports `getDb`, `closeDb` for test setup/teardown |
| `package.json` | Dependencies | `sqlite3@^6.0.1` (dev), `sqlite@^5.1.1` (runtime) |

### Current Database Architecture

```
Application Entry
    │
    ▼
src/index.ts ───────────────► getDb() from src/db/sqlite.ts
    │                                    │
    ▼                                    ▼
API Layer                    Database Singleton (dbInstance)
(req/res handlers)           └─► open() with driver: sqlite3.Database
    │                              └─► initializeSchema() on first open
    ▼
Repository Layer              SQLite (via sqlite3 native module)
(getDb() calls inside        └─► in-memory for tests
services files)              └─► file-based (database.sqlite) for prod
```

### Current SQLite Usage Patterns
The codebase uses the `sqlite` package's promise-based API with `sqlite3` as the underlying native driver:

| Method | Usage in Codebase | Operations Called With It |
|--------|-------------------|--------------------------|
| `db.exec()` | Schema creation (CREATE TABLE IF NOT EXISTS) | `src/db/sqlite.ts`, all tests via `getDb()` |
| `db.run()` | INSERT, UPDATE statements with parameterized values | EventRepository (create, update), ReleaseRepository |
| `db.all()` | SELECT * queries returning arrays | EventRepository (findAll), other services |
| `db.get()` | Single row SELECT queries by ID | EventRepository (findById), other services |
| `db.close()` | Cleanup in test teardown and shutdown | src/db/sqlite.ts, api.test.ts |

### Current Dependencies
```json
{
  "dependencies": { "sqlite": "^5.1.1" },
  "devDependencies": { "sqlite3": "^6.0.1" }
}
```

**Key architectural detail**: The project uses the `sqlite` package (promisified wrapper) with `sqlite3` as its driver. The driver is explicitly passed in the connection config:
```typescript
import sqlite3 from 'sqlite3';
dbInstance = await open({
  filename: dbPath,
  driver: sqlite3.Database
});
```

## Recommended Approach: Using `sqlite` with `better-sqlite3` (Recommended) or `sql.js`

### Why Not sqlite3-offline-next Directly?

The package `sqlite3-offline-next` is a fork of the native `sqlite3` module with prebuilt binaries for Node.js. However, based on current ecosystem analysis:

1. **`sqlite3-offline-next` still replaces the native `sqlite3`**: It provides prebuilt binaries but doesn't fundamentally change the async callback pattern
2. **Better alternative exists**: `better-sqlite3` is a synchronous, zero-dependency SQLite binding that works offline by default and has prebuilt binaries for all major platforms
3. **`sql.js` is the true WASM-based offline option**: Uses WebAssembly SQLite compiled from C, requires no native compilation at all

### Recommended: Migrate to `better-sqlite3` with synchronous pattern

#### Why better-sqlite3?

| Property | Current (sqlite + sqlite3) | Recommended (better-sqlite3) |
|----------|---------------------------|------------------------------|
| API style | Promise-based (via `sqlite` wrapper) | Synchronous (direct calls) |
| Native compilation | Required (`node-gyp`) | Prebuilt binaries for all platforms |
| Bundle size | ~2MB (sqlite3 native binary) | ~1.5MB prebuilt binaries |
| Offline capability | Requires network for native module install | Zero dependency on external services |
| Performance | Async overhead per call | 3-5x faster (synchronous, no event loop) |
| Ecosystem maturity | Mature (since 2013) | Mature (since 2015, widely adopted) |
| TypeScript support | Via `@types/sqlite3` + sqlite types | Built-in (excellent type definitions) |
| Memory-mapped I/O support | | Yes, with `.enableWAL()` and `.integrityCheck()` |

#### Alternative: sql.js (True WASM-based)
If strict "no native code" is required:
- Uses `sql.js` (WASM SQLite, ~800KB)
- Pure JavaScript runtime — no native bindings at all
- Trade-off: ~2x slower than better-sqlite3, no WAL support by default

### Implementation Approach (better-sqlite3)

## Implementation Steps

### Step 1: Update Dependencies in package.json

**Remove:**
```bash
npm uninstall sqlite3 sqlite
```

**Add:**
```bash
npm install better-sqlite3
npm uninstall -D @types/sqlite3 @types/node # if no longer needed separately
```

**Updated dependencies in package.json:**
| Remove | Add |
|--------|-----|
| `"sqlite": "^5.1.1"` (dependencies) | `"better-sqlite3": "^12.x"` (dependencies) |
| `"sqlite3": "^6.0.1"` (devDependencies) | *— no devDependency needed —* |

### Step 2: Rewrite `src/db/sqlite.ts` — Migrate from async sqlite + sqlite3 to better-sqlite3

**Before (current):**
```typescript
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const dbPath = process.env.NODE_ENV === 'test'
    ? ':memory:'
    : path.join(__dirname, '../../database.sqlite');

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await initializeSchema(dbInstance);
  return dbInstance;
}

async function initializeSchema(db: Database) {
  await db.exec(`CREATE TABLE IF NOT EXISTS ...`);
}

export async function closeDb() {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}
```

**After (better-sqlite3):**
```typescript
import Database from 'better-sqlite3';
import path from 'path';

let dbInstance: Database | null = null;

export function getDb(): Database {
  if (dbInstance) return dbInstance;

  const dbPath = process.env.NODE_ENV === 'test'
    ? ':memory:'
    : path.join(__dirname, '../../database.sqlite');

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL'); // Enable WAL mode for better concurrent access

  initializeSchema(db);
  dbInstance = db;
  return db;
}

function initializeSchema(db: Database) {
  db.exec(`CREATE TABLE IF NOT EXISTS ...`); // Same SQL, synchronous exec()
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close(); // Synchronous close, no await needed
    dbInstance = null;
  }
}
```

**Key differences from current code:**
- No `async/await` needed — better-sqlite3 is synchronous
- Remove `sqlite3` import entirely (no explicit driver)
- Use `new Database(path)` instead of `open()` with driver config
- Add WAL pragma for better concurrent read/write performance

### Step 3: Update `src/services/EventRepository.ts` — Convert async calls to sync

**Before (current):**
```typescript
export class EventRepository {
  async create(data: CreateEvent): Promise<Event> {
    const db = await getDb(); // async getDb()
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.run(`INSERT INTO event (...) VALUES (?, ?, ...)`, [...]);
    return this.findById(id) as Promise<Event>; // async findById returns Promise
  }

  async findAll(): Promise<Event[]> {
    const db = await getDb();
    const rows = await db.all(`SELECT * FROM event ORDER BY created_at DESC`);
    return rows.map(mapRowToEvent);
  }

  async findById(id: string): Promise<Event | null> {
    const db = await getDb();
    const row = await db.get(`SELECT * FROM event WHERE id = ?`, [id]);
    if (!row) return null;
    return mapRowToEvent(row);
  }

  async update(id: string, data: UpdateEvent): Promise<Event | null> {
    const db = await getDb();
    // ... async operations
  }
}
```

**After (better-sqlite3):**
```typescript
export class EventRepository {
  create(data: CreateEvent): Event {
    const db = getDb(); // No await needed
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertStmt = db.prepare(
      `INSERT INTO event (id, name, time_windows, created_at, ...) VALUES (?, ?, ?, ?, ...)`
    );

    insertStmt.run(id, data.name, JSON.stringify(data.time_windows), now, ...);
    return this.findById(id)!; // findById no longer returns Promise
  }

  findAll(): Event[] {
    const db = getDb();
    // Use prepared statement for safety + performance
    const rows = db.prepare(`SELECT * FROM event ORDER BY created_at DESC`).all();
    return (rows as any[]).map(mapRowToEvent);
  }

  findById(id: string): Event | null {
    const db = getDb();
    // Prepared statement with .get() returns single row or undefined
    const row = db.prepare(`SELECT * FROM event WHERE id = ?`).get(id);
    if (!row) return null;
    return mapRowToEvent(row as any);
  }

  update(id: string, data: UpdateEvent): Event | null {
    const db = getDb();
    // ... synchronous operations using .prepare().run() pattern
  }
}
```

**Migration notes:**
- Use `db.prepare()` for statements called multiple times (cached SQL) — improves performance by avoiding repeated parse overhead
- `db.prepare().get()` returns a row object or `undefined` (not null!) — adjust type narrowing accordingly
- `db.prepare().run()` returns `{ changes, lastInsertRowid }` — if the code relies on `changes`, update accordingly
- Remove all `await` keywords around DB calls

### Step 4: Update `src/services/ApplicationRepository.ts` — Same pattern

Apply the same conversion as EventRepository (async → sync, remove awaits).

### Step 5: Update `src/services/ReleaseRepository.ts` — Same pattern + check foreign key usage

Apply same conversion. Additionally verify:
- Any `FOREIGN KEY` statements (currently only in schema creation, which SQLite doesn't enforce by default)
- Check if foreign key enforcement is needed and add `PRAGMA foreign_keys = ON;` in schema initialization if so

### Step 6: Update `src/index.ts` — Entry point changes

**Before (current):**
```typescript
import { getDb } from './db/sqlite';

async function startServer() {
  const db = await getDb(); // async call
  server.listen(PORT, () => { ... });
}

startServer().catch(console.error);
```

**After (better-sqlite3):**
```typescript
import { getDb, closeDb } from './db/sqlite';

function startServer() {
  const db = getDb(); // synchronous call — no await needed

  server.listen(PORT, () => { ... });
}

// Graceful shutdown — better-sqlite3 close() is sync
process.on('SIGTERM', () => {
  closeDb();
  server.close(...);
});

startServer();
```

### Step 7: Update Test Files — Remove async DB setup/teardown

**Before (current):**
```typescript
import { getDb, closeDb } from '../db/sqlite';

beforeEach(async () => {
  await closeDb();
});

afterAll(async () => {
  await closeDb();
});
```

**After (better-sqlite3):**
```typescript
import { getDb, closeDb } from '../db/sqlite';

beforeEach(() => {
  closeDb(); // Synchronous — no await needed
});

afterAll(() => {
  closeDb();
});
```

**Additional test file changes:**
- Remove `async` from test functions that only interact with the database (unless they have actual async assertions)
- All repository `create()`, `findAll()`, `findById()`, `update()` calls no longer need `await`
- Test assertions on returned values are now direct, not wrapped in Promise

### Step 8: Update `src/api/routes.ts` — If endpoints call repo methods directly

If routes invoke repository methods, remove `await` from those calls. Routes themselves should remain async (for Express handlers).

### Step 9: Verify `src/api/app.ts` — No changes expected

The Express app module should be unaffected (only exports the router). Verify no direct DB calls.

### Step 10: Build & Test Verification

**Build:**
```bash
npm run build
```

**Run tests:**
```bash
npm test
```

**Verify Docker build (if applicable):**
```bash
docker build -t processmanager:test .
```

**Verify in production-like environment:**
- Confirm `database.sqlite` is created on first run (or reuses existing from migration)
- Verify WAL files (`database.sqlite-wal`, `database.sqlite-shm`) are managed correctly during development
- Confirm no native compilation warnings in Docker build

### Step 11: Update Documentation (if applicable)

Update any `README.md` or docs that reference `sqlite3`:
- README.md — if it mentions database dependencies/compilation requirements
- `docs/codebase/STACK.md` — update stack documentation if it records sqlite3
- Check for any deployment docs that mention native module compilation

## Migration Checklist

| # | Step | Status |
|---|------|--------|
| 1 | Update package.json dependencies (`remove sqlite + sqlite3`, `add better-sqlite3`) | ☐ |
| 2 | Rewrite `src/db/sqlite.ts` (async → sync, remove driver config) | ☐ |
| 3 | Update `src/services/EventRepository.ts` (remove await, use prepare()) | ☐ |
| 4 | Update `src/services/ApplicationRepository.ts` (remove await, use prepare()) | ☐ |
| 5 | Update `src/services/ReleaseRepository.ts` (remove await, use prepare()) | ☐ |
| 6 | Update `src/index.ts` (remove async from entry point) | ☐ |
| 7 | Update all test files (`api.test.ts`, `*Repository.test.ts`) (remove await) | ☐ |
| 8 | Run full test suite and verify all pass | ☐ |
| 9 | Verify Docker build succeeds (no native compilation failures) | ☐ |
| 10 | Update documentation as needed | ☐ |

## Deployment Considerations

| Concern | Detail |
|---------|--------|
| Docker build | No `node-gyp` compilation needed — prebuilt binaries installed via npm automatically. Build will be faster and more reliable |
| CI/CD pipeline | `npm install` may need to download prebuilt binary (usually cached). No build-time compilation step to fail |
| ARM64 compatibility | `better-sqlite3` provides prebuilt binaries for arm64 (M1/M2 Macs, ARM servers) |
| Platform support | Linux x64/arm64, macOS x64/arm64, Windows x64 — full coverage |
| Runtime requirements | No system-level SQLite dependency (embedded library) |

## Risk Assessment and Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| `better-sqlite3` is synchronous — blocking the event loop under heavy load | Medium (design consideration) | Only use in non-critical API paths or wrap in worker threads for bulk operations |
| Existing `database.sqlite` files need migration from sqlite3 format | Low (compatible) | SQLite file formats are identical — existing databases work without migration |
| Prebuilt binary for the user's platform not available by better-sqlite3 | Very Low (rare) | falls back to compiling from source; supported platforms cover 99%+ of use cases |
| `prepare()` API changes return type from `{ changes, lastInsertRowid }` | Low (minor code review needed) | Review all `db.run()` calls in tests to ensure assertions match new return type |
| Synchronous DB calls change API response times for concurrent requests | Medium (performance review) | Enable WAL mode, use prepared statements, monitor slow queries; wrap in worker threads if needed |
| Test suite has `async/await` patterns that depend on DB being async | Medium (code changes required) | Step 7 covers converting test files — comprehensive before/after examples provided |

## Rollback Plan

If issues arise, rollback changes in reverse order:
1. Revert `src/db/sqlite.ts` to use `sqlite3` + `sqlite` approach (git revert)
2. Revert repository files to async patterns
3. Restore package.json dependencies: `npm install sqlite3@^6.0.1 sqlite@^5.1.1`
4. Run `npm test` to verify original behavior is restored

## Timeline Estimate

| Phase | Effort |
|-------|--------|
| Dependency update + `sqlite.ts` rewrite | 15–20 min |
| Repository files conversion (3 services) | 20–30 min |
| Entry point + API route updates | 10–15 min |
| Test file conversions (4 test files) | 20–30 min |
| Build verification + Docker rebuild | 20–30 min |
| Code review + CI pass | 15–30 min |
| **Total** | **~1.5 to 2.5 hours** |

## Acceptance Criteria

- [ ] `sqlite3` and `sqlite` packages removed from package.json
- [ ] `better-sqlite3` is the only SQLite dependency in use (in both dependencies and devDependencies)
- [ ] All `await` keywords removed from database access code across services, entry point, and tests
- [ ] All test files pass without modification to assertions (behavior preserved)
- [ ] Docker build completes without native compilation (`node-gyp`) steps or warnings
- [ ] Existing `database.sqlite` file can be opened without errors (format compatibility verified)
- [ ] API endpoints return the same responses as before migration
- [ ] WAL mode enabled (verified via `db.pragma('journal_mode')` returns `'wal'`)

## Alternative Approaches Considered (and Rejected)

| Approach | Why Not Chosen |
|----------|----------------|
| **sqlite3-offline-next (direct)** | Still async callback-based, still requires native module installation pattern, less performance gain. Our codebase uses `sqlite` wrapper with explicit driver — migration would require more changes than switching to better-sqlite3 |
| **sql.js (WASM)** | ~2x slower than better-sqlite3, no WAL support by default, requires manual WASM loading in Node.js. Only chosen if "zero native code" is a hard requirement |
| **Prisma/ORM layer** | Adds complexity (schema file, migrations, query builder) for what is currently a simple K/V store. Overkill for the current schema |
| **PostgreSQL (pg already installed)** | Requires infrastructure setup, external services. Outside scope of offline-first goal |

## References

- [better-sqlite3 documentation](https://github.com/WiseLibs/better-sqlite3)
- [sqlite package documentation](https://github.com/Mapbox/node-sqlite3) (current, for reference during migration)
- [sqlite package wrapper docs](https://www.npmjs.com/package/sqlite) (current, for reference during migration)
- [SQLite WAL Mode documentation](https://www.sqlite.org/wal.html)
- [(Current repository reference: .gitlab-ci.yml, Dockerfile)](./../..)