import { createEnv } from '@t3-oss/env-core'
import 'server-only'
import { z } from 'zod'

export const env = createEnv({
  server: {
    AMPLITUDE_API_KEY: z.string().optional(),
    VAPID_PRIVATE_KEY: z.string().default('123'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
