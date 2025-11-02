import 'server-only'
import { z } from 'zod'

import { NotificationFilter } from './types'

export const GETNotificationSchema = z.object({
  nextId: z.coerce.number().nullable(),
  filters: z.array(z.enum(NotificationFilter)).optional(),
})
