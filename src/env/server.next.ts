import { createEnv } from '@t3-oss/env-core'
import 'server-only'
import { z } from 'zod'

export const env = createEnv({
  server: {
    AMPLITUDE_API_KEY: z.string().optional(),
    NEON_DATABASE_URL: z.url().optional(),
    NEON_DATABASE_URL_RO: z.url().optional(),
    VAPID_PRIVATE_KEY: z.string().default('123'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
