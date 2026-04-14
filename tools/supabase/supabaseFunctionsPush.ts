import dotenv from 'dotenv'

import { applyDeclaredSupabaseFunctions } from './applyDeclaredFunctions'

const envFile = process.env.DB_ENV === 'production' ? '.env.production' : '.env.development'
dotenv.config({ path: envFile, override: true })

const dbUrl = process.env.POSTGRES_URL_DIRECT ?? process.env.POSTGRES_URL

if (!dbUrl) {
  console.error(`Database URL is missing. Checked ${envFile} for POSTGRES_URL_DIRECT and POSTGRES_URL.`)
  process.exit(1)
}

try {
  await applyDeclaredSupabaseFunctions(dbUrl, {
    log: (message) => console.log(`[supabase-functions] ${message}`),
  })
} catch (error) {
  console.error(error)
  process.exit(1)
}
