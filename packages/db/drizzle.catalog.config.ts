import { defineConfig } from 'drizzle-kit'

import { postgresURLToDrizzleCredentials } from './drizzle.postgres'
import { env } from './src/catalog/env'
import { env as cliEnv } from './src/env.cli'

const { CATALOG_POSTGRES_CERTIFICATE } = env
const { CATALOG_POSTGRES_URL_DIRECT } = cliEnv

export default defineConfig({
  schema: 'src/catalog/schema.ts',
  dialect: 'postgresql',
  dbCredentials: postgresURLToDrizzleCredentials(CATALOG_POSTGRES_URL_DIRECT, CATALOG_POSTGRES_CERTIFICATE),
  strict: true,
})
