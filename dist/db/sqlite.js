"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.closeDb = closeDb;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
let dbInstance = null;
function getDb() {
    if (dbInstance)
        return dbInstance;
    const dbPath = process.env.NODE_ENV === 'test'
        ? ':memory:'
        : path_1.default.join(__dirname, '../../database.sqlite');
    const db = new better_sqlite3_1.default(dbPath);
    db.pragma('journal_mode = WAL');
    initializeSchema(db);
    dbInstance = db;
    return db;
}
function initializeSchema(db) {
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
function closeDb() {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
    }
}
