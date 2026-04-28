import { randomUUID } from 'crypto';
import { getDb, closeDb } from '../db/sqlite';
import type Database from 'better-sqlite3';
import { Application, CreateApplication } from '../types';

export class ApplicationRepository {
  createApplication(data: CreateApplication): Application {
    const db = getDb();
    const id = randomUUID();
    const created_at = new Date().toISOString();
    const environmentsJson = JSON.stringify(data.environments);

    db.prepare(
      `INSERT INTO application (id, name, environments, created_at)
       VALUES (?, ?, ?, ?)`
    ).run(id, data.name, environmentsJson, created_at);

    return {
      id,
      name: data.name,
      environments: data.environments,
      created_at,
    };
  }

  getAllApplications(): Application[] {
    const db = getDb();
    const rows = db.prepare(`SELECT * FROM application`).all();

    return (rows as any[]).map((row) => ({
      id: row.id,
      name: row.name,
      environments: JSON.parse(row.environments),
      created_at: row.created_at,
    }));
  }
}