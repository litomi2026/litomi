import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import 'server-only'

import { NEON_DATABASE_URL } from '@/constants/env'

import * as schema from './schema'

const neonClient = neon(NEON_DATABASE_URL)
export const neonDB = drizzle({ client: neonClient, schema })
