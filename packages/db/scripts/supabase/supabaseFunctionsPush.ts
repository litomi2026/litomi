import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { applySupabaseFunctions } from './applySupabaseFunctions'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const workspaceRoot = path.resolve(packageRoot, '../..')
const envFile = process.env.DB_ENV === 'production' ? '.env.production' : '.env.development'
const envPath = path.join(workspaceRoot, envFile)

dotenv.config({ path: envPath, override: true })

const dbUrl = process.env.POSTGRES_URL_DIRECT ?? process.env.POSTGRES_URL

if (!dbUrl) {
  console.error(`Database URL is missing. Checked ${envFile} for POSTGRES_URL_DIRECT and POSTGRES_URL.`)
  process.exit(1)
}

try {
  await applySupabaseFunctions(dbUrl, {
    directory: path.join(packageRoot, 'src/database/supabase/functions'),
    log: (message) => console.log(`[supabase-functions] ${message}`),
  })
} catch (error) {
  console.error(error)
  process.exit(1)
}
