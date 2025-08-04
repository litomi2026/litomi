import { z } from 'zod/v4'

export enum NotificationFilter {
  ALL = 'all',
  UNREAD = 'unread',
  READ = 'read',
}

export const GETNotificationSchema = z.object({
  nextId: z.coerce.number().nullable(),
  filter: z.enum(NotificationFilter).nullable(),
  types: z.array(z.coerce.number()).nullable(),
})
