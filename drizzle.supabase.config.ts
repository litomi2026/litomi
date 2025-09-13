import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle/supabase',
  schema: './src/database/supabase/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL_DIRECT ?? '',
    ssl: process.env.SUPABASE_CERTIFICATE
      ? { ca: process.env.SUPABASE_CERTIFICATE, rejectUnauthorized: true }
      : 'prefer',
  },
})
