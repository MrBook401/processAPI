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
exports.routes.post('/events', async (req, res) => {
    const parseResult = types_1.CreateEventSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parseResult.error.issues });
    }
    try {
        const event = await eventRepo.create(parseResult.data);
        res.status(201).json(event);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.routes.get('/events', async (req, res) => {
    try {
        const events = await eventRepo.findAll();
        res.status(200).json(events);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.routes.patch('/events/:id', async (req, res) => {
    const parseResult = types_1.UpdateEventSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parseResult.error.issues });
    }
    try {
        const event = await eventRepo.update(req.params.id, parseResult.data);
        if (!event)
            return res.status(404).json({ error: 'Event not found' });
        res.status(200).json(event);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.routes.post('/release/attach', async (req, res) => {
    const parseResult = types_1.AttachReleaseSchema.safeParse(req.body);
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
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.routes.patch('/release/attach', async (req, res) => {
    const parseResult = types_1.AttachReleaseSchema.safeParse(req.body);
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
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.routes.get('/release/validate/id', async (req, res) => {
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
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.routes.post('/applications', async (req, res) => {
    const parseResult = types_1.CreateApplicationSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parseResult.error.issues });
    }
    try {
        const application = await applicationRepo.createApplication(parseResult.data);
        res.status(201).json(application);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.routes.get('/applications', async (req, res) => {
    try {
        const applications = await applicationRepo.getAllApplications();
        res.status(200).json(applications);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
