import dotenv from 'dotenv'
import { defineConfig } from 'drizzle-kit'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(packageRoot, '../..')
const envFile = process.env.DB_ENV === 'production' ? '.env.production' : '.env.development'

dotenv.config({ path: path.join(workspaceRoot, envFile) })

export default defineConfig({
  out: path.join(packageRoot, 'drizzle/supabase'),
  schema: path.join(packageRoot, 'src/database/supabase'),
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL_DIRECT ?? '',
    ssl: process.env.SUPABASE_CERTIFICATE
      ? { ca: process.env.SUPABASE_CERTIFICATE, rejectUnauthorized: true }
      : 'prefer',
  },
  strict: true,
})
