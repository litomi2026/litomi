import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { env } from './env'

const {
  CHAT_POSTGRES_APPLICATION_NAME,
  CHAT_POSTGRES_CERTIFICATE,
  CHAT_POSTGRES_CONNECT_TIMEOUT_SECONDS,
  CHAT_POSTGRES_IDLE_TIMEOUT_SECONDS,
  CHAT_POSTGRES_POOL_MAX,
  CHAT_POSTGRES_URL,
} = env

const client = postgres(CHAT_POSTGRES_URL, {
  max: CHAT_POSTGRES_POOL_MAX,
  idle_timeout: CHAT_POSTGRES_IDLE_TIMEOUT_SECONDS,
  connect_timeout: CHAT_POSTGRES_CONNECT_TIMEOUT_SECONDS,
  connection: { application_name: CHAT_POSTGRES_APPLICATION_NAME },
  ssl: CHAT_POSTGRES_CERTIFICATE ? { ca: CHAT_POSTGRES_CERTIFICATE, rejectUnauthorized: true } : 'prefer',
})

export const chatDB = drizzle({ client })
