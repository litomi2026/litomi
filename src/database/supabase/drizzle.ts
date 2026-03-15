import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import 'server-only'

import { env } from '@/env/server.common'

import * as activitySchema from './activity'
import * as bbatonSchema from './bbaton'
import * as censorshipSchema from './censorship'
import * as chatSchema from './chat'
import * as dmcaSchema from './dmca'
import * as librarySchema from './library'
import * as notificationSchema from './notification'
import * as passkeySchema from './passkey'
import * as pointsSchema from './points'
import * as postSchema from './post'
import * as reportSchema from './report'
import * as twoFactorSchema from './two-factor'
import * as userSchema from './user'

const {
  POSTGRES_URL,
  POSTGRES_APPLICATION_NAME,
  POSTGRES_CONNECT_TIMEOUT_SECONDS,
  POSTGRES_HEALTHCHECK_CACHE_MS,
  POSTGRES_IDLE_TIMEOUT_SECONDS,
  POSTGRES_MAX_LIFETIME_SECONDS,
  POSTGRES_POOL_MAX,
  SUPABASE_CERTIFICATE,
} = env

type DatabaseReadiness = {
  checkedAt: Date
  connected: boolean
}

const baseClientOptions = {
  idle_timeout: POSTGRES_IDLE_TIMEOUT_SECONDS,
  connect_timeout: POSTGRES_CONNECT_TIMEOUT_SECONDS,
  max_lifetime: POSTGRES_MAX_LIFETIME_SECONDS,
  connection: {
    application_name: POSTGRES_APPLICATION_NAME,
  },
  ssl: SUPABASE_CERTIFICATE ? { ca: SUPABASE_CERTIFICATE, rejectUnauthorized: true } : ('prefer' as const),
}

const supabaseClient = postgres(POSTGRES_URL, {
  ...baseClientOptions,
  max: POSTGRES_POOL_MAX,
})

export const db = drizzle({
  client: supabaseClient,
  schema: {
    ...activitySchema,
    ...bbatonSchema,
    ...chatSchema,
    ...censorshipSchema,
    ...dmcaSchema,
    ...librarySchema,
    ...notificationSchema,
    ...passkeySchema,
    ...pointsSchema,
    ...postSchema,
    ...reportSchema,
    ...twoFactorSchema,
    ...userSchema,
  },
})

const healthCheckClient = postgres(POSTGRES_URL, {
  ...baseClientOptions,
  max: 1,
  idle_timeout: Math.min(POSTGRES_IDLE_TIMEOUT_SECONDS, 5),
  connect_timeout: Math.min(POSTGRES_CONNECT_TIMEOUT_SECONDS, 2),
  connection: {
    application_name: `${POSTGRES_APPLICATION_NAME}-health`,
  },
})

let readinessCache: { expiresAt: number; result: DatabaseReadiness } | undefined
let inflightReadinessCheck: Promise<DatabaseReadiness> | undefined

export async function checkDatabaseReadiness(): Promise<DatabaseReadiness> {
  const now = Date.now()

  if (readinessCache && now < readinessCache.expiresAt) {
    return readinessCache.result
  }

  if (inflightReadinessCheck) {
    return inflightReadinessCheck
  }

  inflightReadinessCheck = fetchDatabaseReadiness()
    .then((result) => {
      readinessCache = {
        expiresAt: Date.now() + POSTGRES_HEALTHCHECK_CACHE_MS,
        result,
      }
      return result
    })
    .finally(() => {
      inflightReadinessCheck = undefined
    })

  return inflightReadinessCheck
}

async function fetchDatabaseReadiness(): Promise<DatabaseReadiness> {
  try {
    const [result] = (await healthCheckClient`select 1 as connection`) as Array<{ connection: number }>

    return {
      checkedAt: new Date(),
      connected: result?.connection === 1,
    }
  } catch (error) {
    console.error(error)

    return {
      checkedAt: new Date(),
      connected: false,
    }
  }
}
