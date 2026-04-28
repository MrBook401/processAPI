"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routes = void 0;
const express_1 = require("express");
const EventRepository_1 = require("../services/EventRepository");
const ReleaseRepository_1 = require("../services/ReleaseRepository");
const ApplicationRepository_1 = require("../services/ApplicationRepository");
const WindowCalculationEngine_1 = require("../services/WindowCalculationEngine");
const types_1 = require("../types");
exports.routes = (0, express_1.Router)();
const eventRepo = new EventRepository_1.EventRepository();
const releaseRepo = new ReleaseRepository_1.ReleaseRepository();
const applicationRepo = new ApplicationRepository_1.ApplicationRepository();
const windowEngine = new WindowCalculationEngine_1.WindowCalculationEngine();
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
exports.routes.post('/events', (req, res) => {
    const parseResult = types_1.CreateEventSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parseResult.error.issues });
    }
    try {
        const event = eventRepo.create(parseResult.data);
        res.status(201).json(event);
    }
    catch (err) {
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
exports.routes.get('/events', (req, res) => {
    try {
        const events = eventRepo.findAll();
        res.status(200).json(events);
    }
    catch (err) {
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
exports.routes.patch('/events/:id', (req, res) => {
    const parseResult = types_1.UpdateEventSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parseResult.error.issues });
    }
    try {
        const event = eventRepo.update(req.params.id, parseResult.data);
        if (!event)
            return res.status(404).json({ error: 'Event not found' });
        res.status(200).json(event);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
/**
 * @openapi
 * /events/{id}/releases:
 *   get:
 *     summary: Retrieve all releases attached to an event
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The event ID
 *     responses:
 *       200:
 *         description: A list of release attachments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ReleaseAttachment'
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
exports.routes.get('/events/:id/releases', (req, res) => {
    try {
        const event = eventRepo.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        const releases = releaseRepo.findByEventId(req.params.id);
        res.status(200).json(releases);
    }
    catch (err) {
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
exports.routes.post('/release/attach', (req, res) => {
    const parseResult = types_1.AttachReleaseSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parseResult.error.issues });
    }
    try {
        const existingAttachment = releaseRepo.findByReleaseId(parseResult.data.releaseId);
        if (existingAttachment) {
            return res.status(400).json({ error: 'Release already attached to an event' });
        }
        // Make sure event exists
        const event = eventRepo.findById(parseResult.data.eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        const attachment = releaseRepo.attach(parseResult.data);
        res.status(201).json(attachment);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
/**
 * @openapi
 * /release/attach/{releaseId}:
 *   delete:
 *     summary: Detach a release from an event
 *     parameters:
 *       - in: path
 *         name: releaseId
 *         required: true
 *         schema:
 *           type: string
 *         description: The release ID
 *     responses:
 *       200:
 *         description: Successfully detached release
 *       404:
 *         description: Release attachment not found
 *       500:
 *         description: Server error
 */
exports.routes.delete('/release/attach/:releaseId', (req, res) => {
    const { releaseId } = req.params;
    if (!releaseId) {
        return res.status(400).json({ error: 'Missing releaseId' });
    }
    try {
        const detached = releaseRepo.detach(releaseId);
        if (!detached) {
            return res.status(404).json({ error: 'Release attachment not found' });
        }
        res.status(200).json({ message: 'Successfully detached release' });
    }
    catch (err) {
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
exports.routes.patch('/release/attach', (req, res) => {
    const parseResult = types_1.AttachReleaseSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parseResult.error.issues });
    }
    try {
        const event = eventRepo.findById(parseResult.data.eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        const existing = releaseRepo.findByReleaseId(parseResult.data.releaseId);
        if (!existing) {
            return res.status(404).json({ error: 'Release attachment not found' });
        }
        const attachment = releaseRepo.attach(parseResult.data);
        res.status(200).json(attachment);
    }
    catch (err) {
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
exports.routes.get('/release/validate/id', (req, res) => {
    const { releaseId, eventId, releaseTimestamp, targetEnv } = req.query;
    if (typeof releaseId !== 'string' || typeof eventId !== 'string' || typeof targetEnv !== 'string') {
        return res.status(400).json({ error: 'Missing releaseId, eventId, or targetEnv' });
    }
    // Expect releaseTimestamp to be passed, fallback to now if not.
    const timestamp = typeof releaseTimestamp === 'string' ? releaseTimestamp : new Date().toISOString();
    try {
        const event = eventRepo.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        const attachment = releaseRepo.findByReleaseId(releaseId);
        if (!attachment || attachment.eventId !== eventId) {
            return res.status(400).json({ error: 'Release is not attached to this event' });
        }
        const validation = windowEngine.validateTiming(event, timestamp, targetEnv);
        res.status(200).json(validation);
    }
    catch (err) {
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
exports.routes.post('/applications', (req, res) => {
    const parseResult = types_1.CreateApplicationSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parseResult.error.issues });
    }
    try {
        const application = applicationRepo.createApplication(parseResult.data);
        res.status(201).json(application);
    }
    catch (err) {
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
exports.routes.get('/applications', (req, res) => {
    try {
        const applications = applicationRepo.getAllApplications();
        res.status(200).json(applications);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
/**
 * @openapi
 * /releases:
 *   get:
 *     summary: Retrieve all releases from attachment table
 *     responses:
 *       200:
 *         description: A list of all release attachments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ReleaseAttachment'
 *       500:
 *         description: Server error
 */
exports.routes.get('/releases', (req, res) => {
    try {
        const releases = releaseRepo.findAll();
        res.status(200).json(releases);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
/**
 * @openapi
 * /events/search/releases:
 *   get:
 *     summary: Retrieve releases linked to an event by name
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Event name (case-insensitive partial match)
 *     responses:
 *       200:
 *         description: A list of release attachments for the event
 *       400:
 *         description: Missing or empty name parameter
 *       404:
 *         description: No releases found for event
 *       500:
 *         description: Server error
 */
exports.routes.get('/events/search/', (req, res) => {
    const { name } = req.query;
    if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Missing or empty "name" query parameter' });
    }
    try {
        const releases = releaseRepo.findByEventName(name.trim());
        if (releases.length === 0) {
            return res.status(404).json({ error: 'No releases found for event' });
        }
        res.status(200).json(releases);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
