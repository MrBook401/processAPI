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
      test_start TEXT NOT NULL,
      test_end TEXT NOT NULL,
      preprod_start TEXT NOT NULL,
      preprod_end TEXT NOT NULL,
      prod_start TEXT NOT NULL,
      prod_end TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS release_attachment (
      id TEXT PRIMARY KEY,
      release_id TEXT NOT NULL UNIQUE,
      event_id TEXT NOT NULL,
      attached_at TEXT NOT NULL,
      FOREIGN KEY (event_id) REFERENCES event (id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_release_id ON release_attachment(release_id);
  `);
}

export async function closeDb() {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}
