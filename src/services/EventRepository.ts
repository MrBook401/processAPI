import { getDb } from '../db/sqlite';
import { Event, CreateEvent, UpdateEvent } from '../types';
import crypto from 'crypto';

function mapRowToEvent(row: any): Event {
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

export class EventRepository {
  async create(data: CreateEvent): Promise<Event> {
    const db = await getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await db.run(
      `INSERT INTO event (
        id, name, time_windows, created_at, event_enabled, event_open_for_delivery, type
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        JSON.stringify(data.time_windows),
        now,
        data.event_enabled ? 1 : 0,
        data.event_open_for_delivery ? 1 : 0,
        data.type,
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
      time_windows: data.time_windows ?? existing.time_windows,
      event_enabled: data.event_enabled ?? existing.event_enabled,
      event_open_for_delivery: data.event_open_for_delivery ?? existing.event_open_for_delivery,
      type: data.type ?? existing.type,
    };

    await db.run(
      `UPDATE event SET
        name = ?,
        time_windows = ?,
        event_enabled = ?,
        event_open_for_delivery = ?,
        type = ?
      WHERE id = ?`,
      [
        updated.name,
        JSON.stringify(updated.time_windows),
        updated.event_enabled ? 1 : 0,
        updated.event_open_for_delivery ? 1 : 0,
        updated.type,
        id,
      ]
    );

    return this.findById(id);
  }
}
