import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import 'server-only'

import { env } from '@/env/server.common'

import * as activitySchema from './activity'
import * as authSchema from './auth'
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
  POSTGRES_IDLE_TIMEOUT_SECONDS,
  POSTGRES_MAX_LIFETIME_SECONDS,
  POSTGRES_POOL_MAX,
  SUPABASE_CERTIFICATE,
} = env

const supabaseClient = postgres(POSTGRES_URL, {
  idle_timeout: POSTGRES_IDLE_TIMEOUT_SECONDS,
  connect_timeout: POSTGRES_CONNECT_TIMEOUT_SECONDS,
  max_lifetime: POSTGRES_MAX_LIFETIME_SECONDS,
  connection: { application_name: POSTGRES_APPLICATION_NAME },
  ssl: SUPABASE_CERTIFICATE ? { ca: SUPABASE_CERTIFICATE, rejectUnauthorized: true } : ('prefer' as const),
  max: POSTGRES_POOL_MAX,
  prepare: false,
})

export const db = drizzle({
  client: supabaseClient,
  schema: {
    ...activitySchema,
    ...authSchema,
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
