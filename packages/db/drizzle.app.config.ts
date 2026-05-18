import { env } from '@litomi/env/server.common'
import { defineConfig } from 'drizzle-kit'

const { APP_POSTGRES_CERTIFICATE, APP_POSTGRES_URL_DIRECT } = env

export default defineConfig({
  schema: 'src/database/app/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: APP_POSTGRES_URL_DIRECT,
    ssl: APP_POSTGRES_CERTIFICATE ? { ca: APP_POSTGRES_CERTIFICATE, rejectUnauthorized: true } : 'require',
  },
  strict: true,
})
