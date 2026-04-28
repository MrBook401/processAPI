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
    create(data) {
        const db = (0, sqlite_1.getDb)();
        const id = crypto_1.default.randomUUID();
        const now = new Date().toISOString();
        db.prepare(`INSERT INTO event (id, name, time_windows, created_at, event_enabled, event_open_for_delivery, type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`).run(id, data.name, JSON.stringify(data.time_windows), now, data.event_enabled ? 1 : 0, data.event_open_for_delivery ? 1 : 0, data.type);
        return this.findById(id);
    }
    findAll() {
        const db = (0, sqlite_1.getDb)();
        const rows = db.prepare(`SELECT * FROM event ORDER BY created_at DESC`).all();
        return rows.map(mapRowToEvent);
    }
    findById(id) {
        const db = (0, sqlite_1.getDb)();
        const row = db.prepare(`SELECT * FROM event WHERE id = ?`).get(id);
        if (!row)
            return undefined;
        return mapRowToEvent(row);
    }
    update(id, data) {
        const db = (0, sqlite_1.getDb)();
        const existing = this.findById(id);
        if (!existing)
            return undefined;
        const updated = {
            name: data.name ?? existing.name,
            time_windows: data.time_windows ?? existing.time_windows,
            event_enabled: data.event_enabled ?? existing.event_enabled,
            event_open_for_delivery: data.event_open_for_delivery ?? existing.event_open_for_delivery,
            type: data.type ?? existing.type,
        };
        db.prepare(`UPDATE event SET name = ?, time_windows = ?, event_enabled = ?, event_open_for_delivery = ?, type = ?
       WHERE id = ?`).run(updated.name, JSON.stringify(updated.time_windows), updated.event_enabled ? 1 : 0, updated.event_open_for_delivery ? 1 : 0, updated.type, id);
        return this.findById(id);
    }
}
exports.EventRepository = EventRepository;
