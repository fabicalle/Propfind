import { z } from 'zod';

export const ReportReasonSchema = z.enum([
  'INAPPROPRIATE_CONTENT',
  'NOT_A_REAL_ESTATE',
  'SPAM_OR_FRAUD',
  'OTHER',
]);

export const ModerationActionSchema = z.enum(['ACTIVATE', 'DEACTIVATE', 'DELETE']);

export const UuidSchema = z.string().uuid();

export const UserRoleSchema = z.enum(['FINDER', 'OWNER', 'REALTOR', 'DEVELOPER_B2B', 'ADMIN']);

export const UpdateUserRoleSchema = z.object({
  userId: UuidSchema,
  role: UserRoleSchema,
});

export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;

export const ModeratePropertySchema = z.object({
  propertyId: UuidSchema,
  action: ModerationActionSchema,
});

export type ModeratePropertyInput = z.infer<typeof ModeratePropertySchema>;
