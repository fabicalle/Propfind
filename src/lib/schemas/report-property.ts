import { z } from 'zod';
import { ReportReasonSchema, UuidSchema } from './primitives';

export const ReportPropertySchema = z.object({
  propertyId: UuidSchema,
  reason: ReportReasonSchema,
  details: z.string().min(1).max(2000).optional().or(z.literal('')),
  reporterEmail: z.string().email().optional().or(z.literal('')),
});

export type ReportPropertyInput = z.infer<typeof ReportPropertySchema>;
