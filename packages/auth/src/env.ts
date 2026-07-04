import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    JWT_SECRET_ACCESS_TOKEN: z.string().default('123'),
    JWT_SECRET_REFRESH_TOKEN: z.string().default('456'),
    JWT_SECRET_TRUSTED_DEVICE: z.string().default('789'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
