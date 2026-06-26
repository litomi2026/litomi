import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import postgres from 'postgres'

const repositoryRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const dbPackageDirectory = path.join(repositoryRoot, 'packages/db')

dotenv.config({ path: path.join(dbPackageDirectory, '.env.local') })

const DEFAULT_BACKEND_INTEGRATION_POSTGRES_URL =
  'postgresql://test_user:test_password@localhost:5434/litomi_backend_integration_test'

const testDatabaseUrl = process.env.BACKEND_INTEGRATION_POSTGRES_URL ?? DEFAULT_BACKEND_INTEGRATION_POSTGRES_URL
const testDatabaseName = getDatabaseName(testDatabaseUrl)

if (!testDatabaseName) {
  console.error(`Could not resolve a database name from BACKEND_INTEGRATION_POSTGRES_URL: ${testDatabaseUrl}`)
  process.exit(1)
}

console.log(`[backend-test-db] recreating database ${testDatabaseName}`)
await recreateDatabase(testDatabaseUrl, testDatabaseName)

console.log('[backend-test-db] applying Drizzle schema')
await runCommand(['bunx', 'drizzle-kit', 'push', '--config=drizzle.app.config.ts', '--force'], {
  cwd: dbPackageDirectory,
  env: {
    APP_POSTGRES_URL_DIRECT: testDatabaseUrl,
  },
})

console.log('[backend-test-db] applying app SQL')
await runCommand(['bun', 'scripts/app/syncAppSql.ts'], {
  cwd: dbPackageDirectory,
  env: {
    APP_POSTGRES_URL_DIRECT: testDatabaseUrl,
  },
})

console.log(`[backend-test-db] ready: ${testDatabaseName}`)

type RunCommandOptions = {
  cwd?: string
  env?: Record<string, string>
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

async function runCommand(command: string[], options: RunCommandOptions = {}) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command[0]!, command.slice(1), {
      cwd: options.cwd,
      env: {
        ...process.env,
        ...options.env,
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
