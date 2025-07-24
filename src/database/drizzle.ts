import { drizzle } from 'drizzle-orm/postgres-js'
import 'server-only'

import { POSTGRES_URL } from '@/constants/env'

export const db = drizzle(POSTGRES_URL)
