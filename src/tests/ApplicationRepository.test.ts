import { ApplicationRepository } from '../services/ApplicationRepository';
import { getDb, closeDb } from '../db/sqlite';

describe('ApplicationRepository', () => {
  let repository: ApplicationRepository;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await getDb();
    repository = new ApplicationRepository();
  });

  afterAll(async () => {
    await closeDb();
  });

  it('should create an application', async () => {
    const app = await repository.createApplication({
      name: 'Test App',
      environments: {
        dev: ['CH'],
        test: ['CH', 'EMEA'],
        preprod: ['CH', 'EMEA', 'US'],
        prod: ['APAC', 'CH', 'EMEA', 'US']
      }
    });

    expect(app).toBeDefined();
    expect(app.id).toBeDefined();
    expect(app.name).toBe('Test App');
    expect(app.environments.dev).toEqual(['CH']);
  });

  it('should get all applications', async () => {
    await repository.createApplication({
      name: 'Test App 2',
      environments: {
        dev: [],
        test: [],
        preprod: [],
        prod: []
      }
    });

    const apps = await repository.getAllApplications();
    expect(apps.length).toBeGreaterThan(0);
    const found = apps.find(a => a.name === 'Test App 2');
    expect(found).toBeDefined();
  });
});
