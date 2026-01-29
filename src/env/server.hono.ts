import { createEnv } from '@t3-oss/env-core'
import 'server-only'
import { z } from 'zod'

export const env = createEnv({
  server: {
    ADSTERRA_API_KEY: z.string(),
    BBATON_CLIENT_ID: z.string(),
    BBATON_CLIENT_SECRET: z.string(),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    GA_PROPERTY_ID: z.string().optional(),
    GA_SERVICE_ACCOUNT_EMAIL: z.string().optional(),
    GA_SERVICE_ACCOUNT_KEY: z.string().optional(),
    JWT_SECRET_BBATON_ATTEMPT: z.string().default('bbaton_attempt_secret'),
  },
  runtimeEnv: process.env,
  isServer: true,
  emptyStringAsUndefined: true,
})
