import 'server-only'
import { z } from 'zod'

export const markAsReadSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1),
})

export const deleteNotificationsSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1),
})
