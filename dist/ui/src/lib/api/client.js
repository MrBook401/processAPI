"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchEvents = fetchEvents;
exports.createEvent = createEvent;
exports.attachRelease = attachRelease;
exports.validateRelease = validateRelease;
const API_BASE = 'http://localhost:3001';
async function fetchEvents() {
    const res = await fetch(`${API_BASE}/events`);
    if (!res.ok)
        throw new Error('Failed to fetch events');
    return res.json();
}
async function createEvent(data) {
    const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok)
        throw new Error('Failed to create event');
    return res.json();
}
async function attachRelease(releaseId, eventId) {
    const res = await fetch(`${API_BASE}/release/attach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ releaseId, eventId }),
    });
    if (!res.ok)
        throw new Error('Failed to attach release');
    return res.json();
}
async function validateRelease(releaseId, eventId) {
    const res = await fetch(`${API_BASE}/release/validate/id?releaseId=${releaseId}&eventId=${eventId}`);
    if (!res.ok)
        throw new Error('Failed to validate release');
    return res.json();
}
