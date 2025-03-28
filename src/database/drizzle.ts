import { POSTGRES_URL } from '@/constants/env'
import { drizzle } from 'drizzle-orm/postgres-js'

export const db = drizzle(POSTGRES_URL)
