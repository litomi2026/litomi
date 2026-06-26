import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    APP_POSTGRES_URL_DIRECT: z.url().default('postgresql://test_user:test_password@localhost:5434/app_db'),
    CATALOG_POSTGRES_URL_DIRECT: z.url().default('postgresql://test_user:test_password@localhost:5435/catalog_db'),
    CHAT_POSTGRES_URL_DIRECT: z.url().default('postgresql://test_user:test_password@localhost:5436/chat_db'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
