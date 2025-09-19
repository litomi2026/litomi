import dotenv from 'dotenv'
dotenv.config({ path: process.env.DB_ENV === 'prod' ? '.env.production' : '.env.local' })

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle/neon',
  schema: './src/database/neon/schema.ts',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.NEON_DATABASE_URL_UNPOOLED ?? '' },
})
