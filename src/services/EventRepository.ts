import { getDb } from '../db/sqlite';
import { Event, CreateEvent, UpdateEvent } from '../types';
import crypto from 'crypto';

function mapRowToEvent(row: any): Event {
  return {
    id: row.id,
    name: row.name,
    test_window: { start: row.test_start, end: row.test_end },
    preprod_window: { start: row.preprod_start, end: row.preprod_end },
    prod_window: { start: row.prod_start, end: row.prod_end },
  };
}

export class EventRepository {
  async create(data: CreateEvent): Promise<Event> {
    const db = await getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO event (
        id, name, test_start, test_end, preprod_start, preprod_end, prod_start, prod_end, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.test_window.start,
        data.test_window.end,
        data.preprod_window.start,
        data.preprod_window.end,
        data.prod_window.start,
        data.prod_window.end,
        now,
      ]
    );

    return this.findById(id) as Promise<Event>;
  }

  async findAll(): Promise<Event[]> {
    const db = await getDb();
    const rows = await db.all(`SELECT * FROM event ORDER BY created_at DESC`);
    return rows.map(mapRowToEvent);
  }

  async findById(id: string): Promise<Event | null> {
    const db = await getDb();
    const row = await db.get(`SELECT * FROM event WHERE id = ?`, [id]);
    if (!row) return null;
    return mapRowToEvent(row);
  }

  async update(id: string, data: UpdateEvent): Promise<Event | null> {
    const db = await getDb();
    
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated = {
      name: data.name ?? existing.name,
      test_window: data.test_window ?? existing.test_window,
      preprod_window: data.preprod_window ?? existing.preprod_window,
      prod_window: data.prod_window ?? existing.prod_window,
    };

    await db.run(
      `UPDATE event SET
        name = ?,
        test_start = ?,
        test_end = ?,
        preprod_start = ?,
        preprod_end = ?,
        prod_start = ?,
        prod_end = ?
      WHERE id = ?`,
      [
        updated.name,
        updated.test_window.start,
        updated.test_window.end,
        updated.preprod_window.start,
        updated.preprod_window.end,
        updated.prod_window.start,
        updated.prod_window.end,
        id,
      ]
    );

    return this.findById(id);
  }
}
