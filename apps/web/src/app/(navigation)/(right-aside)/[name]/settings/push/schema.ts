import 'server-only'
import { z } from 'zod'

export const subscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
  userAgent: z.string().optional(),
  username: z.string().min(1),
})

export const unsubscribeSchema = z.object({
  endpoint: z.url(),
  username: z.string().min(1),
})

export const updatePushSettingsSchema = z.object({
  username: z.string().min(1),
  quietEnabled: z.boolean().optional(),
  quietStart: z.coerce.number().min(0).max(23).optional(),
  quietEnd: z.coerce.number().min(0).max(23).optional(),
  batchEnabled: z.boolean().optional(),
  maxDaily: z.coerce.number().min(1).max(999).optional(),
})
