import { Router } from 'express';
import { EventRepository } from '../services/EventRepository';
import { ReleaseRepository } from '../services/ReleaseRepository';
import { ApplicationRepository } from '../services/ApplicationRepository';
import { WindowCalculationEngine } from '../services/WindowCalculationEngine';
import { CreateEventSchema, UpdateEventSchema, AttachReleaseSchema, CreateApplicationSchema } from '../types';

export const routes = Router();
const eventRepo = new EventRepository();
const releaseRepo = new ReleaseRepository();
const applicationRepo = new ApplicationRepository();
const windowEngine = new WindowCalculationEngine();

/**
 * @openapi
 * /events:
 *   post:
 *     summary: Create a new event
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEvent'
 *     responses:
 *       201:
 *         description: Created event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid payload
 *       500:
 *         description: Server error
 */
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

/**
 * @openapi
 * /events:
 *   get:
 *     summary: Retrieve all events
 *     responses:
 *       200:
 *         description: A list of events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       500:
 *         description: Server error
 */
routes.get('/events', async (req, res) => {
  try {
    const events = await eventRepo.findAll();
    res.status(200).json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /events/{id}:
 *   patch:
 *     summary: Update an existing event
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateEvent'
 *     responses:
 *       200:
 *         description: Updated event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid payload
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
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

/**
 * @openapi
 * /release/attach:
 *   post:
 *     summary: Attach a release to an event
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AttachRelease'
 *     responses:
 *       201:
 *         description: Successfully attached release
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReleaseAttachment'
 *       400:
 *         description: Invalid payload
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
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

/**
 * @openapi
 * /release/attach:
 *   patch:
 *     summary: Update a release attachment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AttachRelease'
 *     responses:
 *       200:
 *         description: Successfully updated attachment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReleaseAttachment'
 *       400:
 *         description: Invalid payload
 *       404:
 *         description: Event or release not found
 *       500:
 *         description: Server error
 */
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

/**
 * @openapi
 * /release/validate/id:
 *   get:
 *     summary: Validate if a release can be deployed at a given time
 *     parameters:
 *       - in: query
 *         name: releaseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: releaseTimestamp
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Validation result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationResponse'
 *       400:
 *         description: Missing parameters or not attached
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
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

/**
 * @openapi
 * /applications:
 *   post:
 *     summary: Create a new application
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateApplication'
 *     responses:
 *       201:
 *         description: Created application
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Application'
 *       400:
 *         description: Invalid payload
 *       500:
 *         description: Server error
 */
routes.post('/applications', async (req, res) => {
  const parseResult = CreateApplicationSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parseResult.error.issues });
  }

  try {
    const application = await applicationRepo.createApplication(parseResult.data);
    res.status(201).json(application);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /applications:
 *   get:
 *     summary: Retrieve all applications
 *     responses:
 *       200:
 *         description: A list of applications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Application'
 *       500:
 *         description: Server error
 */
routes.get('/applications', async (req, res) => {
  try {
    const applications = await applicationRepo.getAllApplications();
    res.status(200).json(applications);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
