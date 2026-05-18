import { env } from '@litomi/env/env/server.common'
import { defineConfig } from 'drizzle-kit'

const { CATALOG_POSTGRES_CERTIFICATE, CATALOG_POSTGRES_URL_DIRECT } = env

export default defineConfig({
  schema: 'src/database/catalog/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: CATALOG_POSTGRES_URL_DIRECT,
    ssl: CATALOG_POSTGRES_CERTIFICATE ? { ca: CATALOG_POSTGRES_CERTIFICATE, rejectUnauthorized: true } : 'require',
  },
  strict: true,
})
