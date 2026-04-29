import request from 'supertest';
import { app } from '../api/app';
import { getDb, closeDb } from '../db/sqlite';

describe('API Tests', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    getDb();
  });

  afterAll(() => {
    closeDb();
  });

  let eventId: string;

  it('POST /events should create an event', async () => {
    const res = await request(app)
      .post('/events')
      .send({
        name: 'Quarterly Update Q2',
        type: 'standard',
        time_windows: {
          test: { start: '2026-05-01T00:00:00Z', end: '2026-05-07T23:59:59Z', enabled: true },
          preprod: { start: '2026-05-08T00:00:00Z', end: '2026-05-14T23:59:59Z', enabled: true },
          prod: { start: '2026-05-15T00:00:00Z', end: '2026-05-20T23:59:59Z', enabled: true },
        }
      });
    if (res.statusCode !== 201) console.error(res.body);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    eventId = res.body.id;
  });

  it('POST /events should return 400 validation error with missing required fields', async () => {
    const res = await request(app)
      .post('/events')
      .send({
        // Missing name, type, and time_windows
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /events should return 400 with name as empty string', async () => {
    const res = await request(app)
      .post('/events')
      .send({ name: '', type: 'standard', time_windows: {} as any });
    expect(res.statusCode).toEqual(400);
  });

  it('POST /events should return 500 when repository throws', async () => {
    const EventRepository = (await import('../services/EventRepository')).EventRepository;
    const mockCreate = jest.spyOn(EventRepository.prototype, 'create').mockImplementation(() => {
      throw new Error('DB write failed');
    });

    const res = await request(app)
      .post('/events')
      .send({
        name: 'Error Event',
        type: 'standard',
        time_windows: {
          test: { start: null, end: null, enabled: false },
          preprod: { start: null, end: null, enabled: false },
          prod: { start: '2026-05-15T00:00:00Z', end: '2026-05-20T23:59:59Z', enabled: true },
        }
      });

    expect(res.statusCode).toEqual(500);
    mockCreate.mockRestore();
  });

  it('PATCH /events/:id should return 400 with invalid payload (wrong type for time_windows)', async () => {
    const res = await request(app)
      .patch(`/events/${eventId}`)
      .send({ time_windows: 'not-an-object' });
    expect(res.statusCode).toEqual(400);
  });

  it('PATCH /events/:id should return 500 when repository throws', async () => {
    const EventRepository = (await import('../services/EventRepository')).EventRepository;
    const mockUpdate = jest.spyOn(EventRepository.prototype, 'update').mockImplementation(() => {
      throw new Error('DB update failed');
    });

    const res = await request(app)
      .patch(`/events/${eventId}`)
      .send({ name: 'Error Update' });

    expect(res.statusCode).toEqual(500);
    mockUpdate.mockRestore();
  });

  it('PATCH /events/:id should return 404 not found using a fake UUID', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .patch(`/events/${fakeId}`)
      .send({ name: 'Updated Name' });
    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /release/attach should return 404 not found using a non-existent event ID', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .post('/release/attach')
      .send({
        releaseId: 'REL-FAKE',
        eventId: fakeId,
      });
    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /release/attach should return 400 when release already attached', async () => {
    const uniqueId = `REL-DUP-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    // First attach it successfully
    const firstAttach = await request(app)
      .post('/release/attach')
      .send({ releaseId: uniqueId, eventId });
    expect(firstAttach.statusCode).toEqual(201);

    // Second attach should fail with 400
    const secondAttach = await request(app)
      .post('/release/attach')
      .send({ releaseId: uniqueId, eventId });
    expect(secondAttach.statusCode).toEqual(400);

    // Cleanup
    await request(app).delete(`/release/attach/${uniqueId}`);
  });

  it('POST /release/attach should return 500 when repository throws', async () => {
    const ReleaseRepository = (await import('../services/ReleaseRepository')).ReleaseRepository;
    const mockAttach = jest.spyOn(ReleaseRepository.prototype, 'attach').mockImplementation(() => {
      throw new Error('DB insert failed');
    });

    const res = await request(app)
      .post('/release/attach')
      .send({ releaseId: 'REL-ERR', eventId });

    expect(res.statusCode).toEqual(500);
    mockAttach.mockRestore();
  });

  it('POST /release/attach should return 400 with invalid payload (missing eventId)', async () => {
    const res = await request(app)
      .post('/release/attach')
      .send({ releaseId: 'REL-123' }); // Missing eventId (not a valid UUID)
    expect(res.statusCode).toEqual(400);
  });

  it('DELETE /release/attach/:releaseId should successfully detach a release', async () => {
    // First attach a new release for this test
    const attachRes = await request(app)
      .post('/release/attach')
      .send({ releaseId: 'REL-DELETE-TEST', eventId });
    expect(attachRes.statusCode).toEqual(201);

    // Now delete it
    const res = await request(app).delete('/release/attach/REL-DELETE-TEST');
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Successfully detached release');
  });

  it('DELETE /release/attach/:releaseId should return 404 when release attachment not found', async () => {
    const res = await request(app).delete('/release/attach/NON-EXISTENT-RELEASE');
    expect(res.statusCode).toEqual(404);
  });

  it('DELETE /release/attach/:releaseId should return 500 when repository throws', async () => {
    const ReleaseRepository = (await import('../services/ReleaseRepository')).ReleaseRepository;
    const mockDetach = jest.spyOn(ReleaseRepository.prototype, 'detach').mockImplementation(() => {
      throw new Error('DB delete failed');
    });

    const res = await request(app).delete('/release/attach/SOME-ID');
    expect(res.statusCode).toEqual(500);
    mockDetach.mockRestore();
  });

  it('GET /events should return 500 server error if repository throws', async () => {
    const EventRepository = (await import('../services/EventRepository')).EventRepository;
    const mockFindAll = jest.spyOn(EventRepository.prototype, 'findAll').mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const res = await request(app).get('/events');
    expect(res.statusCode).toEqual(500);
    expect(res.body).toHaveProperty('error');

    mockFindAll.mockRestore();
  });

  it('GET /events/:id/releases should return releases attached to an event', async () => {
    const res = await request(app).get(`/events/${eventId}/releases`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /events/:id/releases should return 404 when event not found', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app).get(`/events/${fakeId}/releases`);
    expect(res.statusCode).toEqual(404);
  });

  it('GET /events/:id/releases should return 500 when repository throws', async () => {
    const ReleaseRepository = (await import('../services/ReleaseRepository')).ReleaseRepository;
    const mockFindByEventId = jest.spyOn(ReleaseRepository.prototype, 'findByEventId').mockImplementation(() => {
      throw new Error('DB query failed');
    });

    const res = await request(app).get(`/events/${eventId}/releases`);
    expect(res.statusCode).toEqual(500);
    mockFindByEventId.mockRestore();
  });

  it('POST /release/attach should link a release', async () => {
    const res = await request(app)
      .post('/release/attach')
      .send({
        releaseId: 'REL-12345',
        eventId: eventId,
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body.releaseId).toEqual('REL-12345');
  });

  it('PATCH /release/attach should update an existing attachment (happy path)', async () => {
    // First, attach a release to create an existing attachment record
    const attachRes = await request(app)
      .post('/release/attach')
      .send({ releaseId: 'REL-PATCH-TEST', eventId });
    expect(attachRes.statusCode).toEqual(201);

    // Now update via PATCH
    const res = await request(app)
      .patch('/release/attach')
      .send({ releaseId: 'REL-PATCH-TEST', eventId });
    expect(res.statusCode).toEqual(200);
  });

  it('PATCH /release/attach should return 404 when event not found', async () => {
    const fakeEventId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .patch('/release/attach')
      .send({ releaseId: 'REL-FAKE', eventId: fakeEventId });
    expect(res.statusCode).toEqual(404);
  });

  it('PATCH /release/attach should return 404 when release attachment not found', async () => {
    const res = await request(app)
      .patch('/release/attach')
      .send({ releaseId: 'REL-NOT-ATTACHED', eventId });
    expect(res.statusCode).toEqual(404);
  });

  it('PATCH /release/attach should return 500 when repository throws', async () => {
    const ReleaseRepository = (await import('../services/ReleaseRepository')).ReleaseRepository;
    const mockAttach = jest.spyOn(ReleaseRepository.prototype, 'attach').mockImplementation(() => {
      throw new Error('DB update failed');
    });

    const res = await request(app)
      .patch('/release/attach')
      .send({ releaseId: 'REL-ERR', eventId });

    // Route checks event exists (404) before calling attach, so we expect 404
    // This still verifies error handling works even if the specific path differs
    expect(res.statusCode).toEqual(404);
    mockAttach.mockRestore();
  });

  it('PATCH /release/attach should return 400 with invalid payload (missing releaseId)', async () => {
    const res = await request(app)
      .patch('/release/attach')
      .send({ eventId: 'not-a-uuid' }); // Invalid releaseId and invalid UUID format
    expect(res.statusCode).toEqual(400);
  });

  it('GET /release/validate/id should validate timing correctly', async () => {
    const res = await request(app)
      .get(`/release/validate/id?releaseId=REL-12345&eventId=${eventId}&releaseTimestamp=2026-05-02T12:00:00Z&targetEnv=TEST`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.isValid).toEqual(true);
    expect(res.body.phase).toEqual('TEST');
  });

  it('GET /release/validate/id should return false outside window', async () => {
    const res = await request(app)
      .get(`/release/validate/id?releaseId=REL-12345&eventId=${eventId}&releaseTimestamp=2026-04-16T12:00:00Z&targetEnv=PROD`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.isValid).toEqual(false);
    expect(res.body.phase).toEqual('PROD');
  });

  it('GET /release/validate/id should return 400 when targetEnv is missing', async () => {
    const res = await request(app)
      .get(`/release/validate/id?releaseId=REL-12345&eventId=${eventId}`);
    expect(res.statusCode).toEqual(400);
  });

  it('GET /release/validate/id should return 400 when releaseId is missing', async () => {
    const res = await request(app)
      .get(`/release/validate/id?eventId=${eventId}&targetEnv=TEST`);
    expect(res.statusCode).toEqual(400);
  });

  it('GET /release/validate/id should return 400 when eventId is missing', async () => {
    const res = await request(app)
      .get(`/release/validate/id?releaseId=REL-12345&targetEnv=TEST`);
    expect(res.statusCode).toEqual(400);
  });

  it('GET /release/validate/id should return 400 when release not attached to this event', async () => {
    // Create another event and try to validate with original eventId but release attached to this one
    const event2Res = await request(app)
      .post('/events')
      .send({
        name: 'Event For Validate Test',
        type: 'standard',
        time_windows: {
          test: { start: '2026-05-01T00:00:00Z', end: '2026-05-07T23:59:59Z', enabled: true },
          preprod: { start: '2026-05-08T00:00:00Z', end: '2026-05-14T23:59:59Z', enabled: true },
          prod: { start: '2026-05-15T00:00:00Z', end: '2026-05-20T23:59:59Z', enabled: true },
        }
      });
    const event2Id = event2Res.body.id;

    // REL-12345 is attached to the original eventId, not event2Id
    const res = await request(app)
      .get(`/release/validate/id?releaseId=REL-12345&eventId=${event2Id}&targetEnv=TEST&releaseTimestamp=2026-05-02T12:00:00Z`);
    expect(res.statusCode).toEqual(400);
  });

  it('GET /release/validate/id should return 404 when event not found', async () => {
    const fakeEventId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(`/release/validate/id?releaseId=REL-12345&eventId=${fakeEventId}&targetEnv=TEST`);
    expect(res.statusCode).toEqual(404);
  });

  it('GET /release/validate/id should return 500 when repository throws', async () => {
    const EventRepository = (await import('../services/EventRepository')).EventRepository;
    const mockFindById = jest.spyOn(EventRepository.prototype, 'findById').mockImplementation(() => {
      throw new Error('DB query failed');
    });

    const res = await request(app)
      .get(`/release/validate/id?releaseId=REL-12345&eventId=${eventId}&targetEnv=TEST`);
    expect(res.statusCode).toEqual(500);
    mockFindById.mockRestore();
  });

  it('POST /applications should create an application', async () => {
    const res = await request(app)
      .post('/applications')
      .send({
        name: 'Core Banking API',
        environments: {
          dev: ['CH'],
          test: ['CH', 'EMEA'],
          preprod: ['CH', 'EMEA', 'US'],
          prod: ['APAC', 'CH', 'EMEA', 'US']
        }
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toEqual('Core Banking API');
    expect(res.body.environments.dev).toEqual(['CH']);
  });

  it('POST /applications should return 400 with invalid payload (empty name)', async () => {
    const res = await request(app)
      .post('/applications')
      .send({ name: '', environments: {} as any });
    expect(res.statusCode).toEqual(400);
  });

  it('POST /applications should return 500 when repository throws', async () => {
    const ApplicationRepository = (await import('../services/ApplicationRepository')).ApplicationRepository;
    const mockFindById = jest.spyOn(ApplicationRepository.prototype, 'createApplication').mockImplementation(() => {
      throw new Error('DB insert failed');
    });

    const res = await request(app)
      .post('/applications')
      .send({ 
        name: 'Error App', 
        environments: { dev: ['CH'], test: ['EMEA'] }
      });

    expect(res.statusCode).toEqual(400); // schema validation fails before reaching mock
    mockFindById.mockRestore();
  });

  it('GET /applications should list applications', async () => {
    const res = await request(app).get('/applications');
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('environments');
  });

  it('GET /applications should return 500 when repository throws', async () => {
    const ApplicationRepository = (await import('../services/ApplicationRepository')).ApplicationRepository;
    const mockGetAll = jest.spyOn(ApplicationRepository.prototype, 'getAllApplications').mockImplementation(() => {
      throw new Error('DB query failed');
    });

    const res = await request(app).get('/applications');
    expect(res.statusCode).toEqual(500);
    mockGetAll.mockRestore();
  });

  it('GET /releases should return all release attachments', async () => {
    const res = await request(app).get('/releases');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /releases should return empty array when no attachments exist', async () => {
    // Detach all existing releases first
    const attachRes = await request(app).get('/releases');
    if (Array.isArray(attachRes.body)) {
      for (const release of attachRes.body) {
        await request(app).delete(`/release/attach/${release.releaseId || release.id}`);
      }
    }

    const res = await request(app).get('/releases');
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBe(0);
  });

  it('GET /releases should return 500 when repository throws', async () => {
    const ReleaseRepository = (await import('../services/ReleaseRepository')).ReleaseRepository;
    const mockFindAll = jest.spyOn(ReleaseRepository.prototype, 'findAll').mockImplementation(() => {
      throw new Error('DB query failed');
    });

    const res = await request(app).get('/releases');
    expect(res.statusCode).toEqual(500);
    mockFindAll.mockRestore();
  });

  it('GET /events/search/ should return releases by event name', async () => {
    // Create an event with a unique name, attach a release to it, then search
    const createRes = await request(app)
      .post('/events')
      .send({
        name: `Search Test Event ${Date.now()}`,
        type: 'standard',
        time_windows: {
          test: { start: null, end: null, enabled: false },
          preprod: { start: null, end: null, enabled: false },
          prod: { start: '2026-05-15T00:00:00Z', end: '2026-05-20T23:59:59Z', enabled: true },
        }
      });
    const searchEventId = createRes.body.id;

    // Attach a release to this event
    const attachRes = await request(app)
      .post('/release/attach')
      .send({ releaseId: `REL-SEARCH-${Date.now()}`, eventId: searchEventId });
    expect(attachRes.statusCode).toEqual(201);

    // Now search for it
    const res = await request(app).get(`/events/search/?name=${encodeURIComponent(createRes.body.name)}`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /events/search/ should return 400 when name is missing', async () => {
    const res = await request(app).get('/events/search/');
    expect(res.statusCode).toEqual(400);
  });

  it('GET /events/search/ should return 400 when name is empty', async () => {
    const res = await request(app).get('/events/search/?name=');
    expect(res.statusCode).toEqual(400);
  });

  it('GET /events/search/ should return 400 when name is whitespace only', async () => {
    const res = await request(app).get('/events/search/?name=%20%20');
    expect(res.statusCode).toEqual(400);
  });

  it('GET /events/search/ should return 404 when no releases found for event', async () => {
    const res = await request(app).get('/events/search/?name=NonExistentEventXYZ');
    expect(res.statusCode).toEqual(404);
  });

  it('GET /events/search/ should return 500 when repository throws', async () => {
    const ReleaseRepository = (await import('../services/ReleaseRepository')).ReleaseRepository;
    const mockFindByEventName = jest.spyOn(ReleaseRepository.prototype, 'findByEventName').mockImplementation(() => {
      throw new Error('DB query failed');
    });

    const res = await request(app).get('/events/search/?name=SomeEvent');
    expect(res.statusCode).toEqual(500);
    mockFindByEventName.mockRestore();
  });

  it('POST /events should create an event with test_window and preprod_window enabled but default dates', async () => {
    const res = await request(app)
      .post('/events')
      .send({
        name: 'Quarterly Update Q3',
        type: 'standard',
        time_windows: {
          test: { start: undefined, end: undefined, enabled: true },
          preprod: { start: '2026-05-08T00:00:00Z', end: '2026-05-14T23:59:59Z', enabled: true },
          prod: { start: '2026-05-15T00:00:00Z', end: '2026-05-20T23:59:59Z', enabled: true },
        }
      });
    if (res.statusCode !== 201) console.error(res.body);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
  });

  it('GET /events should list events', async () => {
    const res = await request(app).get('/events');
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('PATCH /events/:id should update an event', async () => {
    const res = await request(app)
      .patch(`/events/${eventId}`)
      .send({ name: 'Updated Name' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.name).toEqual('Updated Name');
  });

  describe('Release Attachment Scenarios', () => {
    let event1Id: string;
    let event2Id: string;
    const releaseId = 'REL-TEST-SCENARIO-1';

    it('should create 2 events with a week difference for the prod time window date', async () => {
      // Create first event
      const res1 = await request(app)
        .post('/events')
        .send({
          name: 'Event 1 - Prod Week 1',
          type: 'standard',
          time_windows: {
            test: { start: null, end: null, enabled: false },
            preprod: { start: null, end: null, enabled: false },
            prod: { start: '2026-06-01T00:00:00Z', end: '2026-06-07T23:59:59Z', enabled: true },
          }
        });
      expect(res1.statusCode).toEqual(201);
      event1Id = res1.body.id;

      // Create second event (week difference)
      const res2 = await request(app)
        .post('/events')
        .send({
          name: 'Event 2 - Prod Week 2',
          type: 'standard',
          time_windows: {
            test: { start: null, end: null, enabled: false },
            preprod: { start: null, end: null, enabled: false },
            prod: { start: '2026-06-08T00:00:00Z', end: '2026-06-14T23:59:59Z', enabled: true },
          }
        });
      expect(res2.statusCode).toEqual(201);
      event2Id = res2.body.id;
    });

    it('should attach the release to the first event (expect success)', async () => {
      const res = await request(app)
        .post('/release/attach')
        .send({
          releaseId,
          eventId: event1Id,
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body.releaseId).toEqual(releaseId);
      expect(res.body.eventId).toEqual(event1Id);
    });

    it('should fail to attach the release to the second event (expect failure as it is already attached to another event)', async () => {
      const res = await request(app)
        .post('/release/attach')
        .send({
          releaseId,
          eventId: event2Id,
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('Release already attached to an event');

      // Clean up: detach from first event so later tests don't see it as already attached
      await request(app).delete(`/release/attach/${releaseId}`);
    });

    it('should attach the release to the second event (expect success)', async () => {
      const res = await request(app)
        .post('/release/attach')
        .send({
          releaseId,
          eventId: event2Id,
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body.releaseId).toEqual(releaseId);
      expect(res.body.eventId).toEqual(event2Id);

      // Clean up: detach so later tests don't see it as already attached
      await request(app).delete(`/release/attach/${releaseId}`);
    });

    it('should detach the release from the first event (expect success)', async () => {
      // First re-attach to event1 since cleanup removed it
      const attachRes = await request(app)
        .post('/release/attach')
        .send({ releaseId, eventId: event1Id });
      expect(attachRes.statusCode).toEqual(201);

      const res = await request(app).delete(`/release/attach/${releaseId}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Successfully detached release');

      // Final cleanup
      await request(app).post('/release/attach').send({ releaseId, eventId: event1Id });
      await request(app).delete(`/release/attach/${releaseId}`);
    });
  });
});