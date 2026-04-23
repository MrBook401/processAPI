import { Router } from 'express';
import { EventRepository } from '../services/EventRepository';
import { ReleaseRepository } from '../services/ReleaseRepository';
import { WindowCalculationEngine } from '../services/WindowCalculationEngine';
import { CreateEventSchema, UpdateEventSchema, AttachReleaseSchema } from '../types';

export const routes = Router();
const eventRepo = new EventRepository();
const releaseRepo = new ReleaseRepository();
const windowEngine = new WindowCalculationEngine();

routes.post('/events', async (req, res) => {
  const parseResult = CreateEventSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parseResult.error.issues });
  }

  try {
    const event = await eventRepo.create(parseResult.data);
    res.status(201).json(event);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

routes.get('/events', async (req, res) => {
  try {
    const events = await eventRepo.findAll();
    res.status(200).json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

routes.patch('/events/:id', async (req, res) => {
  const parseResult = UpdateEventSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parseResult.error.issues });
  }

  try {
    const event = await eventRepo.update(req.params.id, parseResult.data);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.status(200).json(event);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

routes.post('/release/attach', async (req, res) => {
  const parseResult = AttachReleaseSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parseResult.error.issues });
  }

  try {
    // Make sure event exists
    const event = await eventRepo.findById(parseResult.data.eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const attachment = await releaseRepo.attach(parseResult.data);
    res.status(201).json(attachment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

routes.patch('/release/attach', async (req, res) => {
  const parseResult = AttachReleaseSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parseResult.error.issues });
  }

  try {
    const event = await eventRepo.findById(parseResult.data.eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const existing = await releaseRepo.findByReleaseId(parseResult.data.releaseId);
    if (!existing) {
      return res.status(404).json({ error: 'Release attachment not found' });
    }

    const attachment = await releaseRepo.attach(parseResult.data);
    res.status(200).json(attachment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

routes.get('/release/validate/id', async (req, res) => {
  const { releaseId, eventId, releaseTimestamp } = req.query;

  if (typeof releaseId !== 'string' || typeof eventId !== 'string') {
    return res.status(400).json({ error: 'Missing releaseId or eventId' });
  }

  // Expect releaseTimestamp to be passed, fallback to now if not. In real world this comes from registry.
  const timestamp = typeof releaseTimestamp === 'string' ? releaseTimestamp : new Date().toISOString();

  try {
    const event = await eventRepo.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const attachment = await releaseRepo.findByReleaseId(releaseId);
    if (!attachment || attachment.eventId !== eventId) {
      return res.status(400).json({ error: 'Release is not attached to this event' });
    }

    const validation = windowEngine.validateTiming(event, timestamp);
    res.status(200).json(validation);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
