"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReleaseRepository = void 0;
const sqlite_1 = require("../db/sqlite");
const crypto_1 = __importDefault(require("crypto"));
class ReleaseRepository {
    async attach(data) {
        const db = await (0, sqlite_1.getDb)();
        const id = crypto_1.default.randomUUID();
        const attachedAt = new Date().toISOString();
        await db.run(`INSERT INTO release_attachment (id, release_id, event_id, attached_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(release_id) DO UPDATE SET
       event_id = excluded.event_id,
       attached_at = excluded.attached_at`, [id, data.releaseId, data.eventId, attachedAt]);
        const row = await db.get(`SELECT * FROM release_attachment WHERE release_id = ?`, [data.releaseId]);
        return {
            id: row.id,
            releaseId: row.release_id,
            eventId: row.event_id,
            attachedAt: row.attached_at,
        };
    }
    async detach(releaseId) {
        const db = await (0, sqlite_1.getDb)();
        const result = await db.run(`DELETE FROM release_attachment WHERE release_id = ?`, [releaseId]);
        return (result.changes ?? 0) > 0;
    }
    async findByReleaseId(releaseId) {
        const db = await (0, sqlite_1.getDb)();
        const row = await db.get(`SELECT * FROM release_attachment WHERE release_id = ?`, [releaseId]);
        if (!row)
            return null;
        return {
            id: row.id,
            releaseId: row.release_id,
            eventId: row.event_id,
            attachedAt: row.attached_at,
        };
    }
    async findByEventId(eventId) {
        const db = await (0, sqlite_1.getDb)();
        const rows = await db.all(`SELECT * FROM release_attachment WHERE event_id = ?`, [eventId]);
        return rows.map(row => ({
            id: row.id,
            releaseId: row.release_id,
            eventId: row.event_id,
            attachedAt: row.attached_at,
        }));
    }
}
exports.ReleaseRepository = ReleaseRepository;
