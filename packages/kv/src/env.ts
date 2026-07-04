import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    PUBSUB_REDIS_URL: z.url().default('redis://localhost:6381'),
    REDIS_URL: z.url().default('redis://localhost:6380'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
