import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import 'server-only'

import { env } from '@/env/server'

import * as activitySchema from './activity'
import * as bbatonSchema from './bbaton'
import * as censorshipSchema from './censorship'
import * as librarySchema from './library'
import * as notificationSchema from './notification'
import * as passkeySchema from './passkey'
import * as pointsSchema from './points'
import * as postSchema from './post'
import * as twoFactorSchema from './two-factor'
import * as userSchema from './user'

const { POSTGRES_URL, SUPABASE_CERTIFICATE } = env

const supabaseClient = postgres(POSTGRES_URL, {
  prepare: false,
  ssl: SUPABASE_CERTIFICATE ? { ca: SUPABASE_CERTIFICATE, rejectUnauthorized: true } : 'prefer',
})

export const db = drizzle({
  client: supabaseClient,
  schema: {
    ...activitySchema,
    ...bbatonSchema,
    ...censorshipSchema,
    ...librarySchema,
    ...notificationSchema,
    ...passkeySchema,
    ...pointsSchema,
    ...postSchema,
    ...twoFactorSchema,
    ...userSchema,
  },
})
