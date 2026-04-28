import { ReleaseRepository } from '../services/ReleaseRepository';
import { EventRepository } from '../services/EventRepository';
import { getDb, closeDb } from '../db/sqlite';

describe('ReleaseRepository', () => {
  let releaseRepo: ReleaseRepository;
  let eventRepo: EventRepository;
  let eventId: string;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    getDb();
    releaseRepo = new ReleaseRepository();
    eventRepo = new EventRepository();

    const event = eventRepo.create({
      name: 'Release Repo Test Event',
      type: 'standard' as any,
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

  afterAll(() => {
    closeDb();
  });

  it('should attach a release', () => {
    const attachment = releaseRepo.attach({
      releaseId: 'REL-100',
      eventId: eventId
    });
    expect(attachment).toBeDefined();
    expect(attachment.releaseId).toBe('REL-100');
    expect(attachment.eventId).toBe(eventId);
  });

  it('findByReleaseId should return attachment', () => {
    const attachment = releaseRepo.findByReleaseId('REL-100');
    expect(attachment).toBeDefined();
    expect(attachment!.releaseId).toBe('REL-100');
  });

  it('findByReleaseId should return undefined for non-existent release', () => {
    const attachment = releaseRepo.findByReleaseId('REL-999');
    expect(attachment).toBeUndefined();
  });

  it('findByEventId should return attachments', () => {
    const attachments = releaseRepo.findByEventId(eventId);
    expect(attachments.length).toBeGreaterThan(0);
    expect(attachments[0].eventId).toBe(eventId);
  });

  it('should detach a release', () => {
    const success = releaseRepo.detach('REL-100');
    expect(success).toBe(true);

    const attachment = releaseRepo.findByReleaseId('REL-100');
    expect(attachment).toBeUndefined();
  });
});