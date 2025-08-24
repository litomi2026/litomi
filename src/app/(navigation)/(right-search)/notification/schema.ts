import { z } from 'zod/v4'

export const markAsReadSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1),
})

export const deleteNotificationsSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1),
})
