import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

import { DEFAULT_VAPID_PUBLIC_KEY } from './vapid'

export const env = createEnv({
  server: {
    APP_ORIGIN: z.url().default('http://localhost:3000'),
    APP_POSTGRES_URL: z.url().default('postgresql://test_user:test_password@localhost:5434/app_db'),
    APP_POSTGRES_CERTIFICATE: z.string().optional(),
    APP_POSTGRES_POOL_MAX: z.coerce.number().int().positive().default(2),
    APP_POSTGRES_IDLE_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(20),
    APP_POSTGRES_CONNECT_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(10),
    APP_POSTGRES_APPLICATION_NAME: z.string().default('litomi-app-local'),
    CATALOG_POSTGRES_URL: z.url().default('postgresql://test_user:test_password@localhost:5435/catalog_db'),
    CATALOG_POSTGRES_CERTIFICATE: z.string().optional(),
    CATALOG_POSTGRES_POOL_MAX: z.coerce.number().int().positive().default(3),
    CATALOG_POSTGRES_IDLE_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(20),
    CATALOG_POSTGRES_CONNECT_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(10),
    CATALOG_POSTGRES_APPLICATION_NAME: z.string().default('litomi-catalog-local'),
    JWT_SECRET_ACCESS_TOKEN: z.string().default('123'),
    JWT_SECRET_REFRESH_TOKEN: z.string().default('456'),
    JWT_SECRET_TRUSTED_DEVICE: z.string().default('789'),
    REDIS_URL: z.url().default('redis://redis:6380'),

    TOTP_ENCRYPTION_KEY: z
      .string()
      .regex(/^[0-9a-f]{64}$/i, 'TOTP_ENCRYPTION_KEY must be a 64-character hex string')
      .default('1111111111111111111111111111111111111111111111111111111111111111'),

    TURNSTILE_SECRET_KEY: z.string().default('1x0000000000000000000000000000000AA'),
    UPSTASH_KV_REST_API_URL: z.url().default('http://localhost:8079'),
    UPSTASH_KV_REST_API_TOKEN: z.string().default('local_dev_token'),
    VAPID_PUBLIC_KEY: z.string().default(DEFAULT_VAPID_PUBLIC_KEY),
    VAPID_PRIVATE_KEY: z.string().default('pL4WSwlV1gHQUYZOOq7N1oEq0Gbj-_dWnRwph1-Ju0k'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
