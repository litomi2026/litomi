import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  schema: './src/database/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL_NON_POOLING!,
  },
})
