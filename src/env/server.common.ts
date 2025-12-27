import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

const skipValidation = process.env.SKIP_ENV_VALIDATION === 'true'

export const env = createEnv({
  server: {
    AIVEN_CERTIFICATE: z.string().min(1).optional(),
    AIVEN_POSTGRES_URL: z.url(),
    JWT_SECRET_ACCESS_TOKEN: z.string().min(1),
    JWT_SECRET_REFRESH_TOKEN: z.string().min(1),
    JWT_SECRET_TRUSTED_DEVICE: z.string().min(1),
    POSTGRES_URL: z.url(),
    SUPABASE_CERTIFICATE: z.string().min(1).optional(),
    UPSTASH_KV_REST_API_TOKEN: z.string().min(1),
    UPSTASH_KV_REST_API_URL: z.url(),
  },
  runtimeEnv: process.env,
  skipValidation,
  emptyStringAsUndefined: true,
})
