import { createEnv } from '@t3-oss/env-core'
import 'server-only'
import { z } from 'zod'

export const env = createEnv({
  server: {
    ADSTERRA_API_KEY: z.string().optional(),
    BBATON_CLIENT_ID: z.string().default('test-bbaton-client-id'),
    BBATON_CLIENT_SECRET: z.string().default('test-bbaton-client-secret'),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    GA_PROPERTY_ID: z.string().optional(),
    GA_SERVICE_ACCOUNT_EMAIL: z.email().optional(),
    GA_SERVICE_ACCOUNT_KEY: z.string().optional(),
    JWT_SECRET_BBATON_ATTEMPT: z.string().default('test-bbaton-attempt'),
  },
  runtimeEnv: process.env,
  isServer: true,
  emptyStringAsUndefined: true,
})
