import { z } from 'zod';

export const TimeWindowSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
});

export const EventSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  test_window: TimeWindowSchema,
  preprod_window: TimeWindowSchema,
  prod_window: TimeWindowSchema,
});

export const CreateEventSchema = z.object({
  name: z.string().min(1),
  test_window: TimeWindowSchema,
  preprod_window: TimeWindowSchema,
  prod_window: TimeWindowSchema,
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
