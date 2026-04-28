import { ApplicationRepository } from '../services/ApplicationRepository';
import { getDb, closeDb } from '../db/sqlite';

describe('ApplicationRepository', () => {
  let repo: ApplicationRepository;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    closeDb();
    getDb();
    repo = new ApplicationRepository();
  });

  afterAll(() => {
    closeDb();
  });

  it('should create an application', () => {
    const app = repo.createApplication({
      name: 'Test App',
      environments: { dev: ['CH'], test: ['CH'], preprod: [], prod: [] },
    });

    expect(app.id).toBeDefined();
    expect(app.name).toEqual('Test App');
  });

  it('should list applications', () => {
    repo.createApplication({
      name: 'Test App 1',
      environments: { dev: ['CH'], test: ['CH'], preprod: [], prod: [] },
    });

    const apps = repo.getAllApplications();
    expect(apps.length).toBeGreaterThan(0);
  });
});