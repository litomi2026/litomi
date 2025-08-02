import { z } from 'zod/v4'

export const subscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
  userAgent: z.string().optional(),
})

export const unsubscribeSchema = z.object({
  endpoint: z.url(),
})

export const testNotificationSchema = z.object({
  message: z.string().min(1),
})
