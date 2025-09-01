import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import 'server-only'

import { POSTGRES_URL, POSTGRES_URL_NON_POOLING } from '@/constants/env'

// NOTE: Transaction이 필요하지 않은 pooling 연결
export const client = postgres(POSTGRES_URL, { prepare: false })
export const db = drizzle(client)

// NOTE: 여러 쿼리를 하나의 Transaction 내에서 실행해야 할 때
export const sessionDB = drizzle(POSTGRES_URL_NON_POOLING)
