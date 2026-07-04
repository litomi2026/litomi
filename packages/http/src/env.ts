import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    TURNSTILE_SECRET_KEY: z.string().default('1x0000000000000000000000000000000AA'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
