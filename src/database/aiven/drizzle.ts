import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import 'server-only'

import { env } from '@/backend/env'
import { sec } from '@/utils/date'

import * as schema from './schema'

const { AIVEN_CERTIFICATE, AIVEN_POSTGRES_URL } = env

const aivenClient = postgres(AIVEN_POSTGRES_URL, {
  max: 3,
  idle_timeout: 20,
  connect_timeout: 10,
  max_lifetime: sec('30 minutes'),
  ssl: AIVEN_CERTIFICATE ? { ca: AIVEN_CERTIFICATE, rejectUnauthorized: true } : 'prefer',
})

export const aivenDB = drizzle({ client: aivenClient, schema })
