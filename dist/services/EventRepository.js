"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventRepository = void 0;
const sqlite_1 = require("../db/sqlite");
const crypto_1 = __importDefault(require("crypto"));
function mapRowToEvent(row) {
    return {
        id: row.id,
        name: row.name,
        test_window: { start: row.test_start, end: row.test_end, enabled: Boolean(row.test_enabled) },
        preprod_window: { start: row.preprod_start, end: row.preprod_end, enabled: Boolean(row.preprod_enabled) },
        prod_window: { start: row.prod_start, end: row.prod_end, enabled: Boolean(row.prod_enabled) },
    };
}
class EventRepository {
    async create(data) {
        const db = await (0, sqlite_1.getDb)();
        const id = crypto_1.default.randomUUID();
        const now = new Date().toISOString();
        await db.run(`INSERT INTO event (
        id, name, test_start, test_end, test_enabled, preprod_start, preprod_end, preprod_enabled, prod_start, prod_end, prod_enabled, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            id,
            data.name,
            data.test_window.start || '0000-00-00T00:00:00Z',
            data.test_window.end || '0000-00-00T00:00:00Z',
            data.test_window.enabled ? 1 : 0,
            data.preprod_window.start || '0000-00-00T00:00:00Z',
            data.preprod_window.end || '0000-00-00T00:00:00Z',
            data.preprod_window.enabled ? 1 : 0,
            data.prod_window.start || '0000-00-00T00:00:00Z',
            data.prod_window.end || '0000-00-00T00:00:00Z',
            data.prod_window.enabled ? 1 : 0,
            now,
        ]);
        return this.findById(id);
    }
    async findAll() {
        const db = await (0, sqlite_1.getDb)();
        const rows = await db.all(`SELECT * FROM event ORDER BY created_at DESC`);
        return rows.map(mapRowToEvent);
    }
    async findById(id) {
        const db = await (0, sqlite_1.getDb)();
        const row = await db.get(`SELECT * FROM event WHERE id = ?`, [id]);
        if (!row)
            return null;
        return mapRowToEvent(row);
    }
    async update(id, data) {
        const db = await (0, sqlite_1.getDb)();
        const existing = await this.findById(id);
        if (!existing)
            return null;
        const updated = {
            name: data.name ?? existing.name,
            test_window: data.test_window ?? existing.test_window,
            preprod_window: data.preprod_window ?? existing.preprod_window,
            prod_window: data.prod_window ?? existing.prod_window,
        };
        await db.run(`UPDATE event SET
        name = ?,
        test_start = ?,
        test_end = ?,
        test_enabled = ?,
        preprod_start = ?,
        preprod_end = ?,
        preprod_enabled = ?,
        prod_start = ?,
        prod_end = ?,
        prod_enabled = ?
      WHERE id = ?`, [
            updated.name,
            updated.test_window.start,
            updated.test_window.end,
            updated.test_window.enabled ? 1 : 0,
            updated.preprod_window.start,
            updated.preprod_window.end,
            updated.preprod_window.enabled ? 1 : 0,
            updated.prod_window.start,
            updated.prod_window.end,
            updated.prod_window.enabled ? 1 : 0,
            id,
        ]);
        return this.findById(id);
    }
}
exports.EventRepository = EventRepository;
