import request from 'supertest';
import { app } from '../api/app';
import { getDb, closeDb } from '../db/sqlite';

describe('API Tests', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await getDb();
  });

  afterAll(async () => {
    await closeDb();
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

  it('GET /events/:id/releases should get releases attached to an event', async () => {
    const res = await request(app).get(`/events/${eventId}/releases`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toEqual(1);
    expect(res.body[0].releaseId).toEqual('REL-12345');
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

  it('GET /applications should list applications', async () => {
    const res = await request(app).get('/applications');
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('environments');
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
    });

    it('should detach the release from the first event (expect success)', async () => {
      const res = await request(app).delete(`/release/attach/${releaseId}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Successfully detached release');
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
    });
  });
});
