import { ReleaseRepository } from '../services/ReleaseRepository';
import { EventRepository } from '../services/EventRepository';
import { getDb, closeDb } from '../db/sqlite';

describe('ReleaseRepository', () => {
  let releaseRepo: ReleaseRepository;
  let eventRepo: EventRepository;
  let eventId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await getDb();
    releaseRepo = new ReleaseRepository();
    eventRepo = new EventRepository();

    const event = await eventRepo.create({
      name: 'Release Repo Test Event',
      type: 'standard',
      event_enabled: true,
      event_open_for_delivery: true,
      time_windows: {
        test: { enabled: true, start: null, end: null },
        preprod: { enabled: true, start: null, end: null },
        prod: { enabled: true, start: null, end: null }
      }
    });
    eventId = event.id;
  });

  afterAll(async () => {
    await closeDb();
  });

  it('should attach a release', async () => {
    const attachment = await releaseRepo.attach({
      releaseId: 'REL-100',
      eventId: eventId
    });
    expect(attachment).toBeDefined();
    expect(attachment.releaseId).toBe('REL-100');
    expect(attachment.eventId).toBe(eventId);
  });

  it('findByReleaseId should return attachment', async () => {
    const attachment = await releaseRepo.findByReleaseId('REL-100');
    expect(attachment).not.toBeNull();
    expect(attachment?.releaseId).toBe('REL-100');
  });

  it('findByReleaseId should return null for non-existent release', async () => {
    const attachment = await releaseRepo.findByReleaseId('REL-999');
    expect(attachment).toBeNull();
  });

  it('findByEventId should return attachments', async () => {
    const attachments = await releaseRepo.findByEventId(eventId);
    expect(attachments.length).toBeGreaterThan(0);
    expect(attachments[0].eventId).toBe(eventId);
  });

  it('should detach a release', async () => {
    const success = await releaseRepo.detach('REL-100');
    expect(success).toBe(true);

    const attachment = await releaseRepo.findByReleaseId('REL-100');
    expect(attachment).toBeNull();
  });
});
