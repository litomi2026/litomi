import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import 'server-only'

import { POSTGRES_URL, SUPABASE_CERTIFICATE } from '@/constants/env'

import * as schema from './schema'

const supabaseClient = postgres(POSTGRES_URL, {
  prepare: false,
  ssl: SUPABASE_CERTIFICATE ? { ca: SUPABASE_CERTIFICATE, rejectUnauthorized: true } : 'prefer',
})

export const db = drizzle({ client: supabaseClient, schema })
