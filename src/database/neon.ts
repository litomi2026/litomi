import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

import { NEON_DATABASE_URL } from '@/constants/env'

const neonClient = neon(NEON_DATABASE_URL)
export const neonDB = drizzle({ client: neonClient })
