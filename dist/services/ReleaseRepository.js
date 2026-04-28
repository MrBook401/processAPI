"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReleaseRepository = void 0;
const sqlite_1 = require("../db/sqlite");
const crypto_1 = __importDefault(require("crypto"));
class ReleaseRepository {
    attach(data) {
        const db = (0, sqlite_1.getDb)();
        const id = crypto_1.default.randomUUID();
        const attachedAt = new Date().toISOString();
        db.prepare(`INSERT INTO release_attachment (id, release_id, event_id, attached_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(release_id) DO UPDATE SET
       event_id = excluded.event_id,
       attached_at = excluded.attached_at`).run(id, data.releaseId, data.eventId, attachedAt);
        const row = db.prepare(`SELECT * FROM release_attachment WHERE release_id = ?`).get(data.releaseId);
        return {
            id: row.id,
            releaseId: row.release_id,
            eventId: row.event_id,
            attachedAt: row.attached_at,
        };
    }
    detach(releaseId) {
        const db = (0, sqlite_1.getDb)();
        const result = db.prepare(`DELETE FROM release_attachment WHERE release_id = ?`).run(releaseId);
        return (result.changes ?? 0) > 0;
    }
    findByReleaseId(releaseId) {
        const db = (0, sqlite_1.getDb)();
        const row = db.prepare(`SELECT * FROM release_attachment WHERE release_id = ?`).get(releaseId);
        if (!row)
            return undefined;
        return {
            id: row.id,
            releaseId: row.release_id,
            eventId: row.event_id,
            attachedAt: row.attached_at,
        };
    }
    findByEventId(eventId) {
        const db = (0, sqlite_1.getDb)();
        const rows = db.prepare(`SELECT * FROM release_attachment WHERE event_id = ?`).all(eventId);
        return rows.map(row => ({
            id: row.id,
            releaseId: row.release_id,
            eventId: row.event_id,
            attachedAt: row.attached_at,
        }));
    }
}
exports.ReleaseRepository = ReleaseRepository;
