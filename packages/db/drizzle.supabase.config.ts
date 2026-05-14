import dotenv from 'dotenv'
dotenv.config({ path: process.env.DB_ENV === 'production' ? '.env.production' : '.env.development' })

import { defineConfig } from 'drizzle-kit'

console.log('👀 - POSTGRES_URL_DIRECT:', process.env.POSTGRES_URL_DIRECT)

export default defineConfig({
  out: './drizzle/supabase',
  schema: './src/database/supabase',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL_DIRECT ?? '',
    ssl: process.env.SUPABASE_CERTIFICATE
      ? { ca: process.env.SUPABASE_CERTIFICATE, rejectUnauthorized: true }
      : 'prefer',
  },
  strict: true,
})
