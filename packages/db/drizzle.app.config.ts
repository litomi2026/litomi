import { env as cliEnv } from '@litomi/env/cli'
import { env } from '@litomi/env/server.common'
import { defineConfig } from 'drizzle-kit'

const { APP_POSTGRES_CERTIFICATE } = env
const { APP_POSTGRES_URL_DIRECT } = cliEnv

export default defineConfig({
  schema: 'src/database/app/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: APP_POSTGRES_URL_DIRECT,
    ssl: APP_POSTGRES_CERTIFICATE ? { ca: APP_POSTGRES_CERTIFICATE, rejectUnauthorized: true } : 'prefer',
  },
  strict: true,
})
