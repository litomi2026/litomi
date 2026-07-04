import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    CATALOG_POSTGRES_URL: z.url().default('postgresql://test_user:test_password@localhost:5435/catalog_db'),
    CATALOG_POSTGRES_CERTIFICATE: z.string().optional(),
    CATALOG_POSTGRES_POOL_MAX: z.coerce.number().int().positive().default(3),
    CATALOG_POSTGRES_IDLE_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(20),
    CATALOG_POSTGRES_CONNECT_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(10),
    CATALOG_POSTGRES_APPLICATION_NAME: z.string().default('litomi-catalog-local'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
