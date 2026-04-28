"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationRepository = void 0;
const crypto_1 = require("crypto");
const sqlite_1 = require("../db/sqlite");
class ApplicationRepository {
    createApplication(data) {
        const db = (0, sqlite_1.getDb)();
        const id = (0, crypto_1.randomUUID)();
        const created_at = new Date().toISOString();
        const environmentsJson = JSON.stringify(data.environments);
        db.prepare(`INSERT INTO application (id, name, environments, created_at)
       VALUES (?, ?, ?, ?)`).run(id, data.name, environmentsJson, created_at);
        return {
            id,
            name: data.name,
            environments: data.environments,
            created_at,
        };
    }
    getAllApplications() {
        const db = (0, sqlite_1.getDb)();
        const rows = db.prepare(`SELECT * FROM application`).all();
        return rows.map((row) => ({
            id: row.id,
            name: row.name,
            environments: JSON.parse(row.environments),
            created_at: row.created_at,
        }));
    }
}
exports.ApplicationRepository = ApplicationRepository;
