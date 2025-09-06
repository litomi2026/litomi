import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import 'server-only'
import ws from 'ws'

import { NEON_DATABASE_URL, NEON_DATABASE_URL_RO } from '@/constants/env'

import * as schema from './schema'

neonConfig.webSocketConstructor = ws
const neonROClient = neon(NEON_DATABASE_URL_RO)
const neonClient = neon(NEON_DATABASE_URL)
export const neonDBRO = drizzle({ client: neonROClient, schema })
export const neonDB = drizzle({ client: neonClient, schema })
