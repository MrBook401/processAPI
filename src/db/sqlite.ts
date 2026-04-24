import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

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
  await db.exec(`
    CREATE TABLE IF NOT EXISTS event (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT 1,
      open_for_release BOOLEAN NOT NULL DEFAULT 1,
      test_start TEXT NULL,
      test_end TEXT NULL,
      test_enabled BOOLEAN NOT NULL DEFAULT 1,
      preprod_start TEXT NULL,
      preprod_end TEXT NULL,
      preprod_enabled BOOLEAN NOT NULL DEFAULT 1,
      prod_start TEXT NOT NULL,
      prod_end TEXT NOT NULL,
      prod_enabled BOOLEAN NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS release_attachment (
      id TEXT PRIMARY KEY,
      release_id TEXT NOT NULL UNIQUE,
      application_id TEXT NULL,
      event_id TEXT NOT NULL,
      attached_at TEXT NOT NULL,
      FOREIGN KEY (event_id) REFERENCES event (id)
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

export async function closeDb() {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}
