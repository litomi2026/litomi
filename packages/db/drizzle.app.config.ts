import { env as cliEnv } from '@litomi/env/cli'
import { defineConfig } from 'drizzle-kit'

import { postgresURLToDrizzleCredentials } from './drizzle.postgres'
import { env } from './src/app/env'

const { APP_POSTGRES_CERTIFICATE } = env
const { APP_POSTGRES_URL_DIRECT } = cliEnv

export default defineConfig({
  schema: 'src/app/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: postgresURLToDrizzleCredentials(APP_POSTGRES_URL_DIRECT, APP_POSTGRES_CERTIFICATE),
  strict: true,
})
