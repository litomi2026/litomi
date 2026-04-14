import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { declaredSupabaseFunctions } from '../../src/database/supabase/functions'

type ApplyDeclaredSupabaseFunctionsOptions = {
  log?: (message: string) => void
}

export async function applyDeclaredSupabaseFunctions(
  rawUrl: string,
  options: ApplyDeclaredSupabaseFunctionsOptions = {},
) {
  const client = createPostgresClient(rawUrl)
  const db = drizzle({ client })
  const log = options.log ?? (() => {})

  try {
    for (const routine of declaredSupabaseFunctions) {
      log(`applying ${routine.name}`)
      await db.execute(routine.definition)
    }

    log(`applied ${declaredSupabaseFunctions.length} declared functions`)
  } finally {
    await client.end({ timeout: 5 })
  }
}

export function withLocalSslDisabled(rawUrl: string) {
  const url = new URL(rawUrl)

  if (isLocalHost(url.hostname) && !url.searchParams.has('sslmode')) {
    url.searchParams.set('sslmode', 'disable')
  }

  return url.toString()
}

function createPostgresClient(rawUrl: string) {
  const resolvedUrl = withLocalSslDisabled(rawUrl)
  const url = new URL(resolvedUrl)

  return postgres(resolvedUrl, {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 5,
    prepare: false,
    ssl: isLocalHost(url.hostname)
      ? false
      : process.env.SUPABASE_CERTIFICATE
        ? { ca: process.env.SUPABASE_CERTIFICATE, rejectUnauthorized: true }
        : ('prefer' as const),
  })
}

function isLocalHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}
