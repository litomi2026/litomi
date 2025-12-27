import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import 'server-only'
import ws from 'ws'

import { env } from '@/env/server.next'

import * as schema from './schema'

const { NEON_DATABASE_URL, NEON_DATABASE_URL_RO } = env

if (!NEON_DATABASE_URL || !NEON_DATABASE_URL_RO) {
  throw new Error('NEON_DATABASE_URL and NEON_DATABASE_URL_RO are required to use Neon DB')
}

neonConfig.webSocketConstructor = ws
const neonROClient = neon(NEON_DATABASE_URL_RO)
const neonClient = neon(NEON_DATABASE_URL)
export const neonDBRO = drizzle({ client: neonROClient, schema })
export const neonDB = drizzle({ client: neonClient, schema })
