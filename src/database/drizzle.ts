import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import 'server-only'

import { POSTGRES_URL, POSTGRES_URL_NON_POOLING } from '@/constants/env'

export const client = postgres(POSTGRES_URL, { prepare: false })
export const db = drizzle(client)
export const sessionDB = drizzle(POSTGRES_URL_NON_POOLING)
