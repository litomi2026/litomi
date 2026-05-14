import { env } from '@litomi/env/env/server.common'
import { sec } from '@litomi/std'
import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

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
