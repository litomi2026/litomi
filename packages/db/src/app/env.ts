import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    APP_POSTGRES_URL: z.url().default('postgresql://test_user:test_password@localhost:5434/app_db'),
    APP_POSTGRES_CERTIFICATE: z.string().optional(),
    APP_POSTGRES_POOL_MAX: z.coerce.number().int().positive().default(2),
    APP_POSTGRES_IDLE_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(20),
    APP_POSTGRES_CONNECT_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(10),
    APP_POSTGRES_APPLICATION_NAME: z.string().default('litomi-app-local'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
