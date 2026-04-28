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

  // Returns ALL rows from release_attachment
  findAll(): ReleaseAttachment[] {
    const db = getDb();
    const rows = db.prepare(
      `SELECT * FROM release_attachment ORDER BY attached_at DESC`
    ).all();

    return (rows as any[]).map(row => ({
      id: row.id,
      releaseId: row.release_id,
      eventId: row.event_id,
      attachedAt: row.attached_at,
    }));
  }

  // Finds all attachments for an event by name (JOIN with event table)
  // SELECT * FROM release_attachment JOIN event on event.id = release_attachment.event_id WHERE LOWER(release_id) LIKE LOWER(EDP);

  findByEventName(eventName: string): ReleaseAttachment[] {
    const db = getDb();
    const rows = db.prepare(
      `SELECT * FROM release_attachment
       JOIN event ON release_attachment.event_id = event.id
       WHERE LOWER(event.name) LIKE LOWER(?)
       ORDER BY release_attachment.attached_at DESC`
    ).all(`%${eventName}%`);

    return (rows as any[]).map(row => ({
      id: row.id,
      releaseId: row.release_id,
      eventId: row.event_id,
      attachedAt: row.attached_at,
    }));
  }
}
