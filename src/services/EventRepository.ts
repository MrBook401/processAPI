import { getDb, closeDb } from '../db/sqlite';
import type Database from 'better-sqlite3';
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
  create(data: CreateEvent): Event {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO event (id, name, time_windows, created_at, event_enabled, event_open_for_delivery, type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.name,
      JSON.stringify(data.time_windows),
      now,
      data.event_enabled ? 1 : 0,
      data.event_open_for_delivery ? 1 : 0,
      data.type,
    );

    return this.findById(id)!;
  }

  findAll(): Event[] {
    const db = getDb();
    const rows = db.prepare(`SELECT * FROM event ORDER BY created_at DESC`).all();
    return (rows as any[]).map(mapRowToEvent);
  }

  findById(id: string): Event | undefined {
    const db = getDb();
    const row = db.prepare(`SELECT * FROM event WHERE id = ?`).get(id);
    if (!row) return undefined;
    return mapRowToEvent(row as any);
  }

  update(id: string, data: UpdateEvent): Event | undefined {
    const db = getDb();

    const existing = this.findById(id);
    if (!existing) return undefined;

    const updated = {
      name: data.name ?? existing.name,
      time_windows: data.time_windows ?? existing.time_windows,
      event_enabled: data.event_enabled ?? existing.event_enabled,
      event_open_for_delivery: data.event_open_for_delivery ?? existing.event_open_for_delivery,
      type: data.type ?? existing.type,
    };

    db.prepare(
      `UPDATE event SET name = ?, time_windows = ?, event_enabled = ?, event_open_for_delivery = ?, type = ?
       WHERE id = ?`
    ).run(
      updated.name,
      JSON.stringify(updated.time_windows),
      updated.event_enabled ? 1 : 0,
      updated.event_open_for_delivery ? 1 : 0,
      updated.type,
      id,
    );

    return this.findById(id);
  }
}