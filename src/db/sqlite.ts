import Database from 'better-sqlite3';
import path from 'path';

let dbInstance: any | null = null;

export function getDb(): any {
  if (dbInstance) return dbInstance;

  const dbPath = process.env.NODE_ENV === 'test'
    ? ':memory:'
    : path.join(__dirname, '../../database.sqlite');

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  initializeSchema(db);
  dbInstance = db;
  return db;
}

function initializeSchema(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS event (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      time_windows TEXT NOT NULL,
      created_at TEXT NOT NULL,
      event_enabled BOOLEAN NOT NULL DEFAULT 1,
      event_open_for_delivery BOOLEAN NOT NULL DEFAULT 1,
      type TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS release_attachment (
      id TEXT PRIMARY KEY,
      release_id TEXT NOT NULL UNIQUE,
      application_id TEXT NULL,
      event_id TEXT NOT NULL,
      attached_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_release_id ON release_attachment(release_id);

    CREATE TABLE IF NOT EXISTS application (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      environments TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}