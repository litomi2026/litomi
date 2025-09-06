import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import 'server-only'

import { POSTGRES_URL } from '@/constants/env'

import * as schema from './schema'

const supabaseClient = postgres(POSTGRES_URL, { prepare: false })
export const db = drizzle({ client: supabaseClient, schema })
