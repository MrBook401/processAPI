"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateApplicationSchema = exports.ApplicationSchema = exports.JurisdictionSchema = exports.EnvironmentSchema = exports.AttachReleaseSchema = exports.UpdateEventSchema = exports.CreateEventSchema = exports.EventSchema = exports.TimeWindowSchema = void 0;
const zod_1 = require("zod");
exports.TimeWindowSchema = zod_1.z.object({
    start: zod_1.z.string().datetime().nullable().default(null),
    end: zod_1.z.string().datetime().nullable().default(null),
    enabled: zod_1.z.boolean().default(true),
});
exports.EventSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1),
    time_windows: zod_1.z.record(zod_1.z.enum(['test', 'preprod', 'prod']), exports.TimeWindowSchema),
    created_at: zod_1.z.string().datetime(),
    event_enabled: zod_1.z.boolean(),
    event_open_for_delivery: zod_1.z.boolean(),
    type: zod_1.z.string(),
});
exports.CreateEventSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    time_windows: zod_1.z.record(zod_1.z.enum(['test', 'preprod', 'prod']), exports.TimeWindowSchema),
    event_enabled: zod_1.z.boolean().optional().default(true),
    event_open_for_delivery: zod_1.z.boolean().optional().default(true),
    type: zod_1.z.string().optional().default('standard'),
});
exports.UpdateEventSchema = exports.CreateEventSchema.partial();
exports.AttachReleaseSchema = zod_1.z.object({
    releaseId: zod_1.z.string().min(1),
    eventId: zod_1.z.string().uuid(),
});
exports.EnvironmentSchema = zod_1.z.enum(['dev', 'test', 'preprod', 'prod']);
exports.JurisdictionSchema = zod_1.z.enum(['APAC', 'CH', 'EMEA', 'US', 'GLOBAL']);
exports.ApplicationSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1),
    environments: zod_1.z.record(exports.EnvironmentSchema, zod_1.z.array(exports.JurisdictionSchema)),
    created_at: zod_1.z.string().datetime(),
});
exports.CreateApplicationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    environments: zod_1.z.record(exports.EnvironmentSchema, zod_1.z.array(exports.JurisdictionSchema)),
});
