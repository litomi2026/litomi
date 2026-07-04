import { createEnv } from '@t3-oss/env-core'

export const env = createEnv({
  server: {},
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
