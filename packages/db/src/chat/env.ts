import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    CHAT_POSTGRES_URL: z.url().default('postgresql://test_user:test_password@localhost:5436/chat_db'),
    CHAT_POSTGRES_CERTIFICATE: z.string().optional(),
    CHAT_POSTGRES_POOL_MAX: z.coerce.number().int().positive().default(3),
    CHAT_POSTGRES_IDLE_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(20),
    CHAT_POSTGRES_CONNECT_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(10),
    CHAT_POSTGRES_APPLICATION_NAME: z.string().default('litomi-chat-local'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
