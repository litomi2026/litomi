import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

const skipValidation = process.env.SKIP_ENV_VALIDATION === 'true'

export const env = createEnv({
  server: {
    AMPLITUDE_API_KEY: z.string().min(1).optional(),
    NEON_DATABASE_URL: z.url().optional(),
    NEON_DATABASE_URL_RO: z.url().optional(),
    VAPID_PRIVATE_KEY: z.string().min(1),
  },
  runtimeEnv: process.env,
  skipValidation,
  emptyStringAsUndefined: true,
})
