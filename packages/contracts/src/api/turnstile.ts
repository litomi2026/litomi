import { z } from 'zod'

export const TURNSTILE_ORIGIN_PROTECTION_ACTION = 'origin-protection'

export const postV1TurnstileClearanceRequestSchema = z.object({
  token: z.string().min(1).max(2048),
})

export type POSTV1TurnstileClearanceRequest = z.infer<typeof postV1TurnstileClearanceRequestSchema>

export const postV1TurnstileClearanceResponseSchema = z.object({
  verified: z.literal(true),
})

export type POSTV1TurnstileClearanceResponse = z.infer<typeof postV1TurnstileClearanceResponseSchema>
