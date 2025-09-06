import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import 'server-only'
import ws from 'ws'

import { NEON_DATABASE_URL } from '@/constants/env'

import * as schema from './schema'

neonConfig.webSocketConstructor = ws
const neonClient = neon(NEON_DATABASE_URL)
export const neonDB = drizzle({ client: neonClient, schema })
