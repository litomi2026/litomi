import dotenv from 'dotenv'
import { spawn } from 'node:child_process'

const envFile = process.env.DB_ENV === 'production' ? '.env.production' : '.env.development'
dotenv.config({ path: envFile, override: true })

const dbUrl = process.env.POSTGRES_URL_DIRECT ?? process.env.POSTGRES_URL

if (!dbUrl) {
  console.error(`Database URL is missing. Checked ${envFile} for POSTGRES_URL_DIRECT and POSTGRES_URL.`)
  process.exit(1)
}

const resolvedDbUrl = withLocalSSLDisabled(dbUrl)

const command = [
  'supabase',
  'db',
  'push',
  '--yes',
  ...(shouldUseDebugMode(resolvedDbUrl) ? ['--debug'] : []),
  '--db-url',
  resolvedDbUrl,
]

const child = spawn('bunx', command, {
  env: process.env,
  stdio: 'inherit',
})

child.on('exit', (code) => {
  process.exit(code ?? 1)
})

child.on('error', (error) => {
  console.error(error)
  process.exit(1)
})

function shouldUseDebugMode(rawUrl: string) {
  const url = new URL(rawUrl)

  // NOTE: Supabase CLI 2.88.1 cannot use SSL when --debug is enabled.
  // Keep --debug only for local plain Postgres where sslmode=disable is expected.
  return url.hostname === 'localhost' || url.hostname === '127.0.0.1'
}

function withLocalSSLDisabled(rawUrl: string) {
  const url = new URL(rawUrl)

  if ((url.hostname === 'localhost' || url.hostname === '127.0.0.1') && !url.searchParams.has('sslmode')) {
    url.searchParams.set('sslmode', 'disable')
  }

  return url.toString()
}
