import dotenv from 'dotenv'
dotenv.config({ path: process.env.DB_ENV === 'production' ? '.env.production' : '.env.development' })

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './packages/db/drizzle/aiven',
  schema: './packages/db/src/database/aiven',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.AIVEN_POSTGRES_URL ?? '',
    ssl: process.env.AIVEN_CERTIFICATE ? { ca: process.env.AIVEN_CERTIFICATE, rejectUnauthorized: true } : 'prefer',
  },
  strict: true,
})
