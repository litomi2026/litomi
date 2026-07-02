import { z } from 'zod'

import { passwordSchema, twoFactorTokenSchema } from '../shared'

export interface POSTV1BBatonAttemptResponse {
  authorizeUrl: string
  expiresIn: number
}

export const postV1BBatonCompleteBodySchema = z.object({
  code: z.string().min(1).max(2048),
  state: z.string().regex(/^[0-9a-f]{64}$/),
})

export const postV1BBatonUnlinkBodySchema = z.object({
  password: passwordSchema,
  token: twoFactorTokenSchema.optional(),
})

export interface POSTV1BBatonUnlinkResponse {
  ok: true
}
