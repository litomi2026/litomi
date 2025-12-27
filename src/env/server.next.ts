import { createEnv } from '@t3-oss/env-core'
import { vercel } from '@t3-oss/env-core/presets-zod'
import { z } from 'zod'

const skipValidation = process.env.SKIP_ENV_VALIDATION === 'true'

export const env = createEnv({
  server: {
    AMPLITUDE_API_KEY: z.string().min(1).optional(),
    NEON_DATABASE_URL: z.url().optional(),
    NEON_DATABASE_URL_RO: z.url().optional(),
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1),
    TOTP_ENCRYPTION_KEY: z.string().regex(/^[0-9a-f]{64}$/i, 'TOTP_ENCRYPTION_KEY must be a 64-character hex string'),
    TURNSTILE_SECRET_KEY: z.string().min(1),
    VAPID_PRIVATE_KEY: z.string().min(1),
  },
  extends: [vercel()],
  runtimeEnv: process.env,
  skipValidation,
  emptyStringAsUndefined: true,
})
