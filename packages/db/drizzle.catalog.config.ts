import { env as cliEnv } from '@litomi/env/cli'
import { env } from '@litomi/env/server.common'
import { defineConfig } from 'drizzle-kit'

import { postgresURLToDrizzleCredentials } from './drizzle.postgres'

const { CATALOG_POSTGRES_CERTIFICATE } = env
const { CATALOG_POSTGRES_URL_DIRECT } = cliEnv

export default defineConfig({
  schema: 'src/catalog/schema.ts',
  dialect: 'postgresql',
  dbCredentials: postgresURLToDrizzleCredentials(CATALOG_POSTGRES_URL_DIRECT, CATALOG_POSTGRES_CERTIFICATE),
  strict: true,
})
