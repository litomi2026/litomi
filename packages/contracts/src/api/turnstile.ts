import { z } from 'zod'

import { turnstileTokenSchema } from '../shared'

export const TURNSTILE_ORIGIN_PROTECTION_ACTION = 'origin-protection'

export const postV1TurnstileClearanceRequestSchema = z.object({
  token: turnstileTokenSchema,
})
