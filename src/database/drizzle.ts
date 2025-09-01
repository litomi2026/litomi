import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import 'server-only'

import { POSTGRES_URL } from '@/constants/env'

// NOTE: Transaction이 필요하지 않은 pooling 연결
export const client = postgres(POSTGRES_URL, { prepare: false })
export const db = drizzle(client)
