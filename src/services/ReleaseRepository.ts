import { getDb, closeDb } from '../db/sqlite';
import type Database from 'better-sqlite3';
import { AttachRelease, ReleaseAttachment } from '../types';
import crypto from 'crypto';

export class ReleaseRepository {
  attach(data: AttachRelease): ReleaseAttachment {
    const db = getDb();
    const id = crypto.randomUUID();
    const attachedAt = new Date().toISOString();

    db.prepare(
      `INSERT INTO release_attachment (id, release_id, event_id, attached_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(release_id) DO UPDATE SET
       event_id = excluded.event_id,
       attached_at = excluded.attached_at`
    ).run(id, data.releaseId, data.eventId, attachedAt);

    const row = db.prepare(
      `SELECT * FROM release_attachment WHERE release_id = ?`
    ).get(data.releaseId) as any;

    return {
      id: row.id,
      releaseId: row.release_id,
      eventId: row.event_id,
      attachedAt: row.attached_at,
    };
  }

  detach(releaseId: string): boolean {
    const db = getDb();
    const result = db.prepare(
      `DELETE FROM release_attachment WHERE release_id = ?`
    ).run(releaseId);
    return (result.changes ?? 0) > 0;
  }

  findByReleaseId(releaseId: string): ReleaseAttachment | undefined {
    const db = getDb();
    const row = db.prepare(
      `SELECT * FROM release_attachment WHERE release_id = ?`
    ).get(releaseId) as any;

    if (!row) return undefined;

    return {
      id: row.id,
      releaseId: row.release_id,
      eventId: row.event_id,
      attachedAt: row.attached_at,
    };
  }

  findByEventId(eventId: string): ReleaseAttachment[] {
    const db = getDb();
    const rows = db.prepare(
      `SELECT * FROM release_attachment WHERE event_id = ?`
    ).all(eventId);

    return (rows as any[]).map(row => ({
      id: row.id,
      releaseId: row.release_id,
      eventId: row.event_id,
      attachedAt: row.attached_at,
    }));
  }
}