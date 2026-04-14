import { readdir } from 'node:fs/promises'
import path from 'node:path'
import postgres from 'postgres'

type ApplySupabaseFunctionsOptions = {
  directory?: string
  log?: (message: string) => void
}

export async function applySupabaseFunctions(
  rawUrl: string,
  options: ApplySupabaseFunctionsOptions = {},
) {
  const functionsDirectory = options.directory ?? path.join(process.cwd(), 'src', 'database', 'supabase', 'functions')
  const files = await readSqlFiles(functionsDirectory)
  const log = options.log ?? (() => {})

  if (files.length === 0) {
    log(`no SQL function files found in ${path.relative(process.cwd(), functionsDirectory)}`)
    return
  }

  const client = createPostgresClient(rawUrl)

  try {
    for (const file of files) {
      log(`applying ${path.relative(process.cwd(), file)}`)
      await client.file(file)
    }

    log(`applied ${files.length} SQL function files`)
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

async function readSqlFiles(functionsDirectory: string) {
  const directoryEntries = await readdir(functionsDirectory, { withFileTypes: true }).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') {
        return []
      }

      throw error
    },
  )

  return directoryEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => path.join(functionsDirectory, entry.name))
    .sort((left, right) => left.localeCompare(right))
}
