import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { env } from './env'

const {
  CATALOG_POSTGRES_APPLICATION_NAME,
  CATALOG_POSTGRES_CERTIFICATE,
  CATALOG_POSTGRES_CONNECT_TIMEOUT_SECONDS,
  CATALOG_POSTGRES_IDLE_TIMEOUT_SECONDS,
  CATALOG_POSTGRES_POOL_MAX,
  CATALOG_POSTGRES_URL,
} = env

const catalogClient = postgres(CATALOG_POSTGRES_URL, {
  max: CATALOG_POSTGRES_POOL_MAX,
  idle_timeout: CATALOG_POSTGRES_IDLE_TIMEOUT_SECONDS,
  connect_timeout: CATALOG_POSTGRES_CONNECT_TIMEOUT_SECONDS,
  connection: { application_name: CATALOG_POSTGRES_APPLICATION_NAME },
  ssl: CATALOG_POSTGRES_CERTIFICATE ? { ca: CATALOG_POSTGRES_CERTIFICATE, rejectUnauthorized: true } : 'prefer',
})

export const catalogDB = drizzle({ client: catalogClient })
