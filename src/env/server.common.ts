import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

const skipValidation = process.env.SKIP_ENV_VALIDATION === 'true'

export const env = createEnv({
  server: {
    AIVEN_CERTIFICATE: z.string().min(1).optional(),
    AIVEN_POSTGRES_URL: z.url(),
    POSTGRES_URL: z.url(),
    SUPABASE_CERTIFICATE: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  skipValidation,
  emptyStringAsUndefined: true,
})
