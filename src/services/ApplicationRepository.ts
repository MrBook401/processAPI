import { randomUUID } from 'crypto';
import { getDb } from '../db/sqlite';
import { Application, CreateApplication } from '../types';

export class ApplicationRepository {
  async createApplication(data: CreateApplication): Promise<Application> {
    const db = await getDb();
    const id = randomUUID();
    const created_at = new Date().toISOString();
    const environmentsJson = JSON.stringify(data.environments);

    await db.run(
      `INSERT INTO application (id, name, environments, created_at)
       VALUES (?, ?, ?, ?)`,
      [id, data.name, environmentsJson, created_at]
    );

    return {
      id,
      name: data.name,
      environments: data.environments,
      created_at
    };
  }

  async getAllApplications(): Promise<Application[]> {
    const db = await getDb();
    const rows = await db.all(`SELECT * FROM application`);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      environments: JSON.parse(row.environments),
      created_at: row.created_at
    }));
  }
}
