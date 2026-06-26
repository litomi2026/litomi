import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    VAPID_PRIVATE_KEY: z.string().default('pL4WSwlV1gHQUYZOOq7N1oEq0Gbj-_dWnRwph1-Ju0k'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
