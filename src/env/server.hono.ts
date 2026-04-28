import { createEnv } from '@t3-oss/env-core'
import 'server-only'
import { z } from 'zod'

export const env = createEnv({
  server: {
    ADSTERRA_API_KEY: z.string().optional(),
    BBATON_CLIENT_ID: z.string().default('test-bbaton-client-id'),
    BBATON_CLIENT_SECRET: z.string().default('test-bbaton-client-secret'),
    GA_PROPERTY_ID: z.string().optional(),
    IMAGE_PROXY_UPSTREAM_PROXY_HOST_SUFFIXES: z.string().optional(),
    IMAGE_PROXY_UPSTREAM_PROXY_URL: z.url().optional(),
    JWT_SECRET_BBATON_ATTEMPT: z.string().default('test-bbaton-attempt'),
  },
  runtimeEnv: process.env,
  isServer: true,
  emptyStringAsUndefined: true,
})
