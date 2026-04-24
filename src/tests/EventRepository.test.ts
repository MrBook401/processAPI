import { EventRepository } from '../services/EventRepository';
import { getDb, closeDb } from '../db/sqlite';

describe('EventRepository', () => {
  let repository: EventRepository;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await getDb();
    repository = new EventRepository();
  });

  afterAll(async () => {
    await closeDb();
  });

  it('should create and retrieve an event', async () => {
    const event = await repository.create({
      name: 'Repo Test Event',
      type: 'standard',
      event_enabled: true,
      event_open_for_delivery: true,
      time_windows: {
        test: { enabled: true, start: null, end: null },
        preprod: { enabled: false, start: null, end: null },
        prod: { enabled: true, start: '2026-01-01T00:00:00Z', end: '2026-01-02T00:00:00Z' }
      }
    });

    expect(event).toBeDefined();
    expect(event.id).toBeDefined();
    expect(event.name).toBe('Repo Test Event');

    const retrieved = await repository.findById(event.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(event.id);
  });

  it('findById should return null for non-existent id', async () => {
    const retrieved = await repository.findById('00000000-0000-0000-0000-000000000000');
    expect(retrieved).toBeNull();
  });

  it('update should update an existing event', async () => {
    const event = await repository.create({
      name: 'Event To Update',
      type: 'standard',
      event_enabled: true,
      event_open_for_delivery: true,
      time_windows: {
        test: { enabled: true, start: null, end: null },
        preprod: { enabled: true, start: null, end: null },
        prod: { enabled: true, start: null, end: null }
      }
    });

    const updated = await repository.update(event.id, { name: 'Updated Repo Event' });
    expect(updated).not.toBeNull();
    expect(updated?.name).toBe('Updated Repo Event');
    
    // Verify changes persisted
    const retrieved = await repository.findById(event.id);
    expect(retrieved?.name).toBe('Updated Repo Event');
  });

  it('update should return null for non-existent id', async () => {
    const updated = await repository.update('00000000-0000-0000-0000-000000000000', { name: 'New Name' });
    expect(updated).toBeNull();
  });

  it('findAll should return all events', async () => {
    const defaultTimeWindows = {
      test: { enabled: true, start: null, end: null },
      preprod: { enabled: true, start: null, end: null },
      prod: { enabled: true, start: null, end: null }
    };
    await repository.create({ name: 'Event A', type: 'standard', event_enabled: true, event_open_for_delivery: true, time_windows: defaultTimeWindows });
    await repository.create({ name: 'Event B', type: 'standard', event_enabled: true, event_open_for_delivery: true, time_windows: defaultTimeWindows });
    const all = await repository.findAll();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });
});
