import { z } from 'zod/v4'

export enum NotificationFilter {
  NEW_MANGA = 'new',
  UNREAD = 'unread',
}

export const GETNotificationSchema = z.object({
  nextId: z.coerce.number().nullable(),
  filters: z.array(z.enum(NotificationFilter)).optional(),
})
