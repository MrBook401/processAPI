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
        test_window: { start: '2026-05-01T00:00:00Z', end: '2026-05-07T23:59:59Z' },
        preprod_window: { start: '2026-05-08T00:00:00Z', end: '2026-05-14T23:59:59Z' },
        prod_window: { start: '2026-05-15T00:00:00Z', end: '2026-05-20T23:59:59Z' },
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    eventId = res.body.id;
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

  it('GET /release/validate/id should validate timing correctly', async () => {
    const res = await request(app)
      .get(`/release/validate/id?releaseId=REL-12345&eventId=${eventId}&releaseTimestamp=2026-05-16T12:00:00Z`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.isValid).toEqual(true);
    expect(res.body.phase).toEqual('PROD');
  });

  it('GET /release/validate/id should return false outside window', async () => {
    const res = await request(app)
      .get(`/release/validate/id?releaseId=REL-12345&eventId=${eventId}&releaseTimestamp=2026-04-16T12:00:00Z`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.isValid).toEqual(false);
  });
});
