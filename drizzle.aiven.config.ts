import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle/aiven',
  schema: './src/database/aiven/schema.ts',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.AIVEN_POSTGRES_URL ?? '' },
})
