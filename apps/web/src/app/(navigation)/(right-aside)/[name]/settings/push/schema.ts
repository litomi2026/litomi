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
