import { drizzle } from 'drizzle-orm/cockroach'
import { Pool } from 'pg'

import { env } from './env'

const {
  CHAT_POSTGRES_APPLICATION_NAME,
  CHAT_POSTGRES_CERTIFICATE,
  CHAT_POSTGRES_CONNECT_TIMEOUT_SECONDS,
  CHAT_POSTGRES_IDLE_TIMEOUT_SECONDS,
  CHAT_POSTGRES_POOL_MAX,
  CHAT_POSTGRES_URL,
} = env

const client = new Pool({
  connectionString: CHAT_POSTGRES_URL,
  max: CHAT_POSTGRES_POOL_MAX,
  idleTimeoutMillis: CHAT_POSTGRES_IDLE_TIMEOUT_SECONDS * 1000,
  connectionTimeoutMillis: CHAT_POSTGRES_CONNECT_TIMEOUT_SECONDS * 1000,
  application_name: CHAT_POSTGRES_APPLICATION_NAME,
  ...(CHAT_POSTGRES_CERTIFICATE && {
    ssl: {
      ca: CHAT_POSTGRES_CERTIFICATE,
      rejectUnauthorized: true,
    },
  }),
})

export const chatDB = drizzle({ client })
