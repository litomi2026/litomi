import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    PORTONE_API_SECRET: z.string().optional(),
    PORTONE_CHANNEL_KEY: z.string().optional(),
    PORTONE_STORE_ID: z.string().optional(),
    PORTONE_WEBHOOK_SECRET: z.string().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
