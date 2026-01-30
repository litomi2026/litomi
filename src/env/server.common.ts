import { createEnv } from '@t3-oss/env-core'
import 'server-only'
import { z } from 'zod'

export const env = createEnv({
  server: {
    AIVEN_POSTGRES_URL: z.string().default('postgresql://test_user:test_password@localhost:5434/test_db'),
    AIVEN_CERTIFICATE: z.string().optional(),
    CIVITAI_API_KEY: z.string().optional(),
    JWT_SECRET_ACCESS_TOKEN: z.string().default('123'),
    JWT_SECRET_REFRESH_TOKEN: z.string().default('456'),
    JWT_SECRET_TRUSTED_DEVICE: z.string().default('789'),
    POSTGRES_URL: z.string().default('postgresql://test_user:test_password@localhost:5434/test_db'),
    POSTGRES_URL_NON_POOLING: z.string().default('postgresql://test_user:test_password@localhost:5434/test_db'),
    POSTGRES_URL_DIRECT: z.string().default('postgresql://test_user:test_password@localhost:5434/test_db'),
    SUPABASE_CERTIFICATE: z.string().optional(),

    TOTP_ENCRYPTION_KEY: z
      .string()
      .regex(/^[0-9a-f]{64}$/i, 'TOTP_ENCRYPTION_KEY must be a 64-character hex string')
      .default('1111111111111111111111111111111111111111111111111111111111111111'),

    TURNSTILE_SECRET_KEY: z.string().default('1x0000000000000000000000000000000AA'),
    UPSTASH_KV_REST_API_URL: z.url().default('http://localhost:8079'),
    UPSTASH_KV_REST_API_TOKEN: z.string().default('local_dev_token'),
    UPSTASH_REDIS_REST_TOKEN: z.string().default('local_dev_token'),
    UPSTASH_REDIS_REST_URL: z.url().default('http://localhost:8079'),
  },
  runtimeEnv: process.env,
  isServer: true,
  emptyStringAsUndefined: true,
})
