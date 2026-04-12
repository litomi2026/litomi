import dotenv from 'dotenv'
import { spawn } from 'node:child_process'
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import postgres from 'postgres'

dotenv.config({ path: '.env.development' })

const DEFAULT_BACKEND_INTEGRATION_POSTGRES_URL =
  'postgresql://test_user:test_password@localhost:5434/litomi_backend_integration_test'

const rawTestDatabaseUrl = process.env.BACKEND_INTEGRATION_POSTGRES_URL ?? DEFAULT_BACKEND_INTEGRATION_POSTGRES_URL
const testDatabaseUrl = withLocalSslDisabled(rawTestDatabaseUrl)
const testDatabaseName = getDatabaseName(testDatabaseUrl)

if (!testDatabaseName) {
  console.error(`Could not resolve a database name from BACKEND_INTEGRATION_POSTGRES_URL: ${rawTestDatabaseUrl}`)
  process.exit(1)
}

console.log(`[backend-test-db] recreating database ${testDatabaseName}`)
await recreateDatabase(testDatabaseUrl, testDatabaseName)

console.log('[backend-test-db] applying Drizzle schema')
await runCommand(['bunx', 'drizzle-kit', 'push', '--config=drizzle.supabase.config.ts', '--force'], {
  NODE_OPTIONS: '--conditions=react-server',
  POSTGRES_URL_DIRECT: testDatabaseUrl,
})

await applySupabaseMigrations(testDatabaseUrl)

console.log(`[backend-test-db] ready: ${testDatabaseName}`)

async function applySupabaseMigrations(databaseUrl: string) {
  const migrationsDirectory = path.join(process.cwd(), 'supabase', 'migrations')
  const files = await readMigrationFiles(migrationsDirectory)

  if (files.length === 0) {
    console.log('[backend-test-db] no SQL migrations to apply')
    return
  }

  const sql = createPostgresClient(databaseUrl)

  try {
    for (const file of files) {
      console.log(`[backend-test-db] applying ${path.relative(process.cwd(), file)}`)
      await sql.file(file)
    }
  } finally {
    await sql.end({ timeout: 5 })
  }
}

function createPostgresClient(rawUrl: string) {
  const url = new URL(rawUrl)

  return postgres(rawUrl, {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 5,
    prepare: false,
    ssl: isLocalHost(url.hostname) ? false : ('prefer' as const),
  })
}

function getAdminDatabaseUrl(rawUrl: string) {
  const url = new URL(rawUrl)
  const databaseName = getDatabaseName(rawUrl)

  url.pathname = `/${databaseName === 'postgres' ? 'template1' : 'postgres'}`
  return url.toString()
}

function getDatabaseName(rawUrl: string) {
  const pathname = new URL(rawUrl).pathname.replace(/^\/+/, '')
  return pathname ? decodeURIComponent(pathname) : ''
}

function isLocalHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function quoteIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}

async function readMigrationFiles(migrationsDirectory: string) {
  const directoryEntries = await readdir(migrationsDirectory, { withFileTypes: true }).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') {
        return []
      }

      throw error
    },
  )

  return directoryEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => path.join(migrationsDirectory, entry.name))
    .sort((left, right) => left.localeCompare(right))
}

async function recreateDatabase(rawUrl: string, databaseName: string) {
  const sql = createPostgresClient(getAdminDatabaseUrl(rawUrl))

  try {
    await sql`select 1`
    await sql`
      select pg_terminate_backend(pid)
      from pg_stat_activity
      where datname = ${databaseName}
        and pid <> pg_backend_pid()
    `
    await sql.unsafe(`drop database if exists ${quoteIdentifier(databaseName)}`)
    await sql.unsafe(`create database ${quoteIdentifier(databaseName)}`)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

async function runCommand(command: string[], envOverrides: Record<string, string> = {}) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command[0]!, command.slice(1), {
      env: {
        ...process.env,
        ...envOverrides,
      },
      stdio: 'inherit',
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${command.join(' ')} exited with code ${code ?? 1}`))
    })

    child.on('error', reject)
  })
}

function withLocalSslDisabled(rawUrl: string) {
  const url = new URL(rawUrl)

  if (isLocalHost(url.hostname) && !url.searchParams.has('sslmode')) {
    url.searchParams.set('sslmode', 'disable')
  }

  return url.toString()
}
