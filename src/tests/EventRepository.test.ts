import { EventRepository } from '../services/EventRepository';
import { getDb, closeDb } from '../db/sqlite';

describe('EventRepository', () => {
  let repo: EventRepository;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    closeDb();
    getDb();
    repo = new EventRepository();
  });

  afterAll(() => {
    closeDb();
  });

  it('should create an event', () => {
    const event = repo.create({
      name: 'Test Event',
      time_windows: {
        test: { start: null, end: null, enabled: false },
        preprod: { start: null, end: null, enabled: false },
        prod: { start: '2026-05-01T00:00:00Z', end: '2026-05-07T23:59:59Z', enabled: true },
      },
      event_enabled: true,
      event_open_for_delivery: true,
      type: 'standard' as any,
    });

    expect(event.id).toBeDefined();
    expect(event.name).toEqual('Test Event');
  });

  it('should find an event by id', () => {
    const event = repo.create({
      name: 'Find Me Event',
      time_windows: {
        test: { start: null, end: null, enabled: false },
        preprod: { start: null, end: null, enabled: false },
        prod: { start: '2026-05-01T00:00:00Z', end: '2026-05-07T23:59:59Z', enabled: true },
      },
      event_enabled: true,
      event_open_for_delivery: true,
      type: 'standard' as any,
    });

    const found = repo.findById(event.id);
    expect(found).toBeDefined();
    expect(found!.name).toEqual('Find Me Event');
  });

  it('should return undefined for non-existent event', () => {
    const found = repo.findById('non-existent-id');
    expect(found).toBeUndefined();
  });

  it('should list all events', () => {
    repo.create({
      name: 'Event 1',
      time_windows: {
        test: { start: null, end: null, enabled: false },
        preprod: { start: null, end: null, enabled: false },
        prod: { start: '2026-05-01T00:00:00Z', end: '2026-05-07T23:59:59Z', enabled: true },
      },
      event_enabled: true,
      event_open_for_delivery: true,
      type: 'standard' as any,
    });

    repo.create({
      name: 'Event 2',
      time_windows: {
        test: { start: null, end: null, enabled: false },
        preprod: { start: null, end: null, enabled: false },
        prod: { start: '2026-05-01T00:00:00Z', end: '2026-05-07T23:59:59Z', enabled: true },
      },
      event_enabled: true,
      event_open_for_delivery: true,
      type: 'standard' as any,
    });

    const events = repo.findAll();
    expect(events.length).toBeGreaterThan(0);
  });

  it('should update an event', () => {
    const event = repo.create({
      name: 'Original Name',
      time_windows: {
        test: { start: null, end: null, enabled: false },
        preprod: { start: null, end: null, enabled: false },
        prod: { start: '2026-05-01T00:00:00Z', end: '2026-05-07T23:59:59Z', enabled: true },
      },
      event_enabled: true,
      event_open_for_delivery: true,
      type: 'standard' as any,
    });

    const updated = repo.update(event.id, { name: 'Updated Name' });
    expect(updated!.name).toEqual('Updated Name');
  });

  it('should return undefined when updating non-existent event', () => {
    const updated = repo.update('non-existent-id', { name: 'Updated' });
    expect(updated).toBeUndefined();
  });
});