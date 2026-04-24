import { getDb } from '../db/sqlite';
import { AttachRelease, ReleaseAttachment } from '../types';
import crypto from 'crypto';

export class ReleaseRepository {
  async attach(data: AttachRelease): Promise<ReleaseAttachment> {
    const db = await getDb();
    const id = crypto.randomUUID();
    const attachedAt = new Date().toISOString();

    await db.run(
      `INSERT INTO release_attachment (id, release_id, event_id, attached_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(release_id) DO UPDATE SET
       event_id = excluded.event_id,
       attached_at = excluded.attached_at`,
      [id, data.releaseId, data.eventId, attachedAt]
    );

    const row = await db.get(
      `SELECT * FROM release_attachment WHERE release_id = ?`,
      [data.releaseId]
    );

    return {
      id: row.id,
      releaseId: row.release_id,
      eventId: row.event_id,
      attachedAt: row.attached_at,
    };
  }

  async detach(releaseId: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.run(
      `DELETE FROM release_attachment WHERE release_id = ?`,
      [releaseId]
    );
    return (result.changes ?? 0) > 0;
  }

  async findByReleaseId(releaseId: string): Promise<ReleaseAttachment | null> {
    const db = await getDb();
    const row = await db.get(
      `SELECT * FROM release_attachment WHERE release_id = ?`,
      [releaseId]
    );

    if (!row) return null;

    return {
      id: row.id,
      releaseId: row.release_id,
      eventId: row.event_id,
      attachedAt: row.attached_at,
    };
  }

  async findByEventId(eventId: string): Promise<ReleaseAttachment[]> {
    const db = await getDb();
    const rows = await db.all(
      `SELECT * FROM release_attachment WHERE event_id = ?`,
      [eventId]
    );

    return rows.map(row => ({
      id: row.id,
      releaseId: row.release_id,
      eventId: row.event_id,
      attachedAt: row.attached_at,
    }));
  }
}
