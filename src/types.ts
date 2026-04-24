import { z } from 'zod';

export const TimeWindowSchema = z.object({
  start: z.string().datetime().nullable().default(null),
  end: z.string().datetime().nullable().default(null),
  enabled: z.boolean().default(true),
});

export const EventSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  time_windows: z.record(z.enum(['test', 'preprod', 'prod']), TimeWindowSchema),
  created_at: z.string().datetime(),
  event_enabled: z.boolean(),
  event_open_for_delivery: z.boolean(),
  type: z.string(),
});

export const CreateEventSchema = z.object({
  name: z.string().min(1),
  time_windows: z.record(z.enum(['test', 'preprod', 'prod']), TimeWindowSchema),
  event_enabled: z.boolean().optional().default(true),
  event_open_for_delivery: z.boolean().optional().default(true),
  type: z.string().optional().default('standard'),
});

export const UpdateEventSchema = CreateEventSchema.partial();

export const AttachReleaseSchema = z.object({
  releaseId: z.string().min(1),
  eventId: z.string().uuid(),
});

export type TimeWindow = z.infer<typeof TimeWindowSchema>;
export type Event = z.infer<typeof EventSchema>;
export type CreateEvent = z.infer<typeof CreateEventSchema>;
export type UpdateEvent = z.infer<typeof UpdateEventSchema>;
export type AttachRelease = z.infer<typeof AttachReleaseSchema>;

export interface ReleaseAttachment {
  id: string;
  releaseId: string;
  eventId: string;
  attachedAt: string;
}

export interface ValidationResponse {
  isValid: boolean;
  phase: 'TEST' | 'PREPROD' | 'PROD' | null;
  message: string;
}

export const EnvironmentSchema = z.enum(['dev', 'test', 'preprod', 'prod']);
export const JurisdictionSchema = z.enum(['APAC', 'CH', 'EMEA', 'US', 'GLOBAL']);

export const ApplicationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  environments: z.record(EnvironmentSchema, z.array(JurisdictionSchema)),
  created_at: z.string().datetime(),
});

export const CreateApplicationSchema = z.object({
  name: z.string().min(1),
  environments: z.record(EnvironmentSchema, z.array(JurisdictionSchema)),
});

export type Environment = z.infer<typeof EnvironmentSchema>;
export type Jurisdiction = z.infer<typeof JurisdictionSchema>;
export type Application = z.infer<typeof ApplicationSchema>;
export type CreateApplication = z.infer<typeof CreateApplicationSchema>;
