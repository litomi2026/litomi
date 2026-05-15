import { z } from 'zod'

export const postV1BBatonAttemptResponseSchema = z.object({
  authorizeUrl: z.string(),
  expiresIn: z.number(),
})

export type POSTV1BBatonAttemptResponse = z.infer<typeof postV1BBatonAttemptResponseSchema>

export const postV1BBatonUnlinkResponseSchema = z.object({
  ok: z.literal(true),
})

export type POSTV1BBatonUnlinkResponse = z.infer<typeof postV1BBatonUnlinkResponseSchema>
