import dotenv from 'dotenv'
dotenv.config({ path: process.env.DB_ENV === 'production' ? '.env.production' : '.env.development' })

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle/neon',
  schema: './src/database/neon',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.NEON_DATABASE_URL_UNPOOLED ?? '' },
})
