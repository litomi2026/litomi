import dotenv from 'dotenv'
import { spawn } from 'node:child_process'
import path from 'node:path'
import postgres from 'postgres'

import { applyAppFunctions, withLocalSslDisabled } from '../packages/db/scripts/app/applyAppFunctions'

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
await runCommand(['bunx', 'drizzle-kit', 'push', '--config=packages/db/drizzle.app.config.ts', '--force'], {
  NODE_OPTIONS: '--conditions=react-server',
  APP_POSTGRES_URL_DIRECT: testDatabaseUrl,
})

console.log('[backend-test-db] applying app function SQL')
await applyAppFunctions(testDatabaseUrl, {
  directory: path.join(process.cwd(), 'packages/db/src/database/app/functions'),
  log: (message) => console.log(`[backend-test-db] ${message}`),
})

console.log(`[backend-test-db] ready: ${testDatabaseName}`)

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
