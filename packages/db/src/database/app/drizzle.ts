import { env } from '@litomi/env/env/server.common'
import { drizzle } from 'drizzle-orm/postgres-js'
import 'server-only'
import postgres from 'postgres'

import * as schema from './schema'

const {
  APP_POSTGRES_CERTIFICATE,
  APP_POSTGRES_APPLICATION_NAME,
  APP_POSTGRES_CONNECT_TIMEOUT_SECONDS,
  APP_POSTGRES_IDLE_TIMEOUT_SECONDS,
  APP_POSTGRES_POOL_MAX,
  APP_POSTGRES_URL,
} = env

const client = postgres(APP_POSTGRES_URL, {
  max: APP_POSTGRES_POOL_MAX,
  idle_timeout: APP_POSTGRES_IDLE_TIMEOUT_SECONDS,
  connect_timeout: APP_POSTGRES_CONNECT_TIMEOUT_SECONDS,
  connection: { application_name: APP_POSTGRES_APPLICATION_NAME },
  ssl: APP_POSTGRES_CERTIFICATE ? { ca: APP_POSTGRES_CERTIFICATE, rejectUnauthorized: true } : 'require',
})

export const db = drizzle({ client, schema })
