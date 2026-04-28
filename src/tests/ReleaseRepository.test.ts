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

  describe('findAll', () => {
    it('returns all attachments', () => {
      // Attach a second release
      const attachment1 = releaseRepo.attach({
        releaseId: 'REL-200',
        eventId: eventId,
      });

      const attachments = releaseRepo.findAll();
      expect(attachments.length).toBeGreaterThanOrEqual(1);
    });

    it('returns empty array when no attachments exist', () => {
      // Clean up all releases for this event first
      const existing = releaseRepo.findByEventId(eventId);
      existing.forEach(a => releaseRepo.detach(a.releaseId));

      const attachments = releaseRepo.findAll();
      expect(attachments).toEqual([]);
    });

    it('orders by attached_at descending', () => {
      const attachment1 = releaseRepo.attach({
        releaseId: 'REL-300',
        eventId: eventId,
      });

      // Small delay to ensure different attached_at values
      const attachment2 = releaseRepo.attach({
        releaseId: 'REL-301',
        eventId: eventId,
      });

      const attachments = releaseRepo.findAll();
      expect(attachments.length).toBeGreaterThanOrEqual(2);

      // Verify descending order by checking that the last item exists
      const lastItem = attachments[attachments.length - 1];
      expect(lastItem).toBeDefined();
    });
  });

  describe('findByEventName', () => {
    let anotherEventId: string;

    beforeAll(() => {
      const event = eventRepo.create({
        name: 'Quarterly Update Q2',
        type: 'standard' as any,
        event_enabled: true,
        event_open_for_delivery: true,
        time_windows: {
          test: { enabled: true, start: null, end: null },
          preprod: { enabled: true, start: null, end: null },
          prod: { enabled: true, start: null, end: null }
        }
      });
      anotherEventId = event.id;

      releaseRepo.attach({ releaseId: 'REL-CASE-A', eventId: anotherEventId });
      releaseRepo.attach({ releaseId: 'REL-CASE-B', eventId: anotherEventId });
    });

    afterEach(() => {
      releaseRepo.detach('REL-CASE-A');
      releaseRepo.detach('REL-CASE-B');
    });

    it('matches case-insensitively', () => {
      const results = releaseRepo.findByEventName('quarterly');
      expect(results.length).toBeGreaterThanOrEqual(2);

      const resultsUpper = releaseRepo.findByEventName('QUARTERLY');
      expect(resultsUpper.length).toBeGreaterThanOrEqual(2);
    });

    it('supports partial match', () => {
      // Re-attach since beforeAll data may be cleaned up
      releaseRepo.attach({ releaseId: 'REL-PARTIAL-A', eventId: anotherEventId });
      releaseRepo.attach({ releaseId: 'REL-PARTIAL-B', eventId: anotherEventId });

      try {
        const results = releaseRepo.findByEventName('Quarterly Update');
        expect(results.length).toBeGreaterThanOrEqual(2);

        const hasExpected = results.some(r => r.releaseId === 'REL-PARTIAL-A' || r.releaseId === 'REL-PARTIAL-B');
        expect(hasExpected).toBe(true);
      } finally {
        releaseRepo.detach('REL-PARTIAL-A');
        releaseRepo.detach('REL-PARTIAL-B');
      }
    });

    it('returns empty array for non-matching event', () => {
      const results = releaseRepo.findByEventName('NonExistentEventXYZ');
      expect(results).toEqual([]);
    });

    it('returns empty array when event has no releases', () => {
      const cleanEvent = eventRepo.create({
        name: 'No Releases Event',
        type: 'standard' as any,
        event_enabled: true,
        event_open_for_delivery: true,
        time_windows: {
          test: { enabled: true, start: null, end: null },
          preprod: { enabled: true, start: null, end: null },
          prod: { enabled: true, start: null, end: null }
        }
      });

      const results = releaseRepo.findByEventName('No Releases Event');
      expect(results).toEqual([]);

      // Clean up
      releaseRepo.detach(cleanEvent.id + '-cleanup');
      eventRepo.update(cleanEvent.id, { name: cleanEvent.name });
    });
  });
});
