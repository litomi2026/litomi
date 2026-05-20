import { env as cliEnv } from '@litomi/env/cli'
import { env } from '@litomi/env/server.common'
import { defineConfig } from 'drizzle-kit'

const { CATALOG_POSTGRES_CERTIFICATE } = env
const { CATALOG_POSTGRES_URL_DIRECT } = cliEnv

export default defineConfig({
  schema: 'src/catalog/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: CATALOG_POSTGRES_URL_DIRECT,
    ssl: CATALOG_POSTGRES_CERTIFICATE ? { ca: CATALOG_POSTGRES_CERTIFICATE, rejectUnauthorized: true } : 'prefer',
  },
  strict: true,
})
