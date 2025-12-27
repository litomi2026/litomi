import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    AIVEN_CERTIFICATE: z.string().min(1).optional(),
    AIVEN_POSTGRES_URL: z.url(),
    BBATON_CLIENT_ID: z.string().min(1),
    BBATON_CLIENT_SECRET: z.string().min(1),
    CORS_ORIGIN: z.string().min(1),
    GA_PROPERTY_ID: z.string().min(1).optional(),
    GA_SERVICE_ACCOUNT_EMAIL: z.string().min(1).optional(),
    GA_SERVICE_ACCOUNT_KEY: z.string().min(1).optional(),
    JWT_SECRET_BBATON_ATTEMPT: z.string().min(1),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
