"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.closeDb = closeDb;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const path_1 = __importDefault(require("path"));
let dbInstance = null;
async function getDb() {
    if (dbInstance)
        return dbInstance;
    const dbPath = process.env.NODE_ENV === 'test'
        ? ':memory:'
        : path_1.default.join(__dirname, '../../database.sqlite');
    dbInstance = await (0, sqlite_1.open)({
        filename: dbPath,
        driver: sqlite3_1.default.Database
    });
    await initializeSchema(dbInstance);
    return dbInstance;
}
async function initializeSchema(db) {
    await db.exec(`
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
async function closeDb() {
    if (dbInstance) {
        await dbInstance.close();
        dbInstance = null;
    }
}
