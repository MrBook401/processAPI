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
        time_windows: JSON.parse(row.time_windows),
        created_at: row.created_at,
        event_enabled: Boolean(row.event_enabled),
        event_open_for_delivery: Boolean(row.event_open_for_delivery),
        type: row.type,
    };
}
class EventRepository {
    async create(data) {
        const db = await (0, sqlite_1.getDb)();
        const id = crypto_1.default.randomUUID();
        const now = new Date().toISOString();
        await db.run(`INSERT INTO event (
        id, name, time_windows, created_at, event_enabled, event_open_for_delivery, type
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            id,
            data.name,
            JSON.stringify(data.time_windows),
            now,
            data.event_enabled ? 1 : 0,
            data.event_open_for_delivery ? 1 : 0,
            data.type,
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
            time_windows: data.time_windows ?? existing.time_windows,
            event_enabled: data.event_enabled ?? existing.event_enabled,
            event_open_for_delivery: data.event_open_for_delivery ?? existing.event_open_for_delivery,
            type: data.type ?? existing.type,
        };
        await db.run(`UPDATE event SET
        name = ?,
        time_windows = ?,
        event_enabled = ?,
        event_open_for_delivery = ?,
        type = ?
      WHERE id = ?`, [
            updated.name,
            JSON.stringify(updated.time_windows),
            updated.event_enabled ? 1 : 0,
            updated.event_open_for_delivery ? 1 : 0,
            updated.type,
            id,
        ]);
        return this.findById(id);
    }
}
exports.EventRepository = EventRepository;
