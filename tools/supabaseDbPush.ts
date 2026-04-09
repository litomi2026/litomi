import dotenv from 'dotenv'
import { spawn } from 'node:child_process'

const envFile = process.env.DB_ENV === 'production' ? '.env.production' : '.env.development'
dotenv.config({ path: envFile })

const dbUrl = process.env.POSTGRES_URL_DIRECT ?? process.env.POSTGRES_URL

if (!dbUrl) {
  console.error(`Database URL is missing. Checked ${envFile} for POSTGRES_URL_DIRECT and POSTGRES_URL.`)
  process.exit(1)
}

const resolvedDbUrl = withLocalSSLDisabled(dbUrl)
// NOTE: Supabase CLI 2.88.1 only respected sslmode=disable reliably for our local plain Postgres
// when debug mode was enabled, so we keep --debug in this wrapper for deterministic local runs.
const command = `bunx supabase db push --yes --debug --db-url '${resolvedDbUrl.replaceAll("'", "'\\''")}'`

const child = spawn(command, {
  env: process.env,
  shell: true,
  stdio: 'inherit',
})

child.on('exit', (code) => {
  process.exit(code ?? 1)
})

child.on('error', (error) => {
  console.error(error)
  process.exit(1)
})

function withLocalSSLDisabled(rawUrl: string) {
  const url = new URL(rawUrl)

  if ((url.hostname === 'localhost' || url.hostname === '127.0.0.1') && !url.searchParams.has('sslmode')) {
    url.searchParams.set('sslmode', 'disable')
  }

  return url.toString()
}
