import { env as cliEnv } from '@litomi/env/cli'
import { defineConfig } from 'drizzle-kit'

import { postgresURLToDrizzleCredentials } from './drizzle.postgres'
import { env } from './src/chat/env'

const { CHAT_POSTGRES_CERTIFICATE } = env
const { CHAT_POSTGRES_URL_DIRECT } = cliEnv

export default defineConfig({
  schema: 'src/chat/schema.ts',
  dialect: 'postgresql',
  dbCredentials: postgresURLToDrizzleCredentials(CHAT_POSTGRES_URL_DIRECT, CHAT_POSTGRES_CERTIFICATE),
  strict: true,
})
