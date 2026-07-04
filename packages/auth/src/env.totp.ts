import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

// TOTP 키는 two-factor·secret-crypto 전용이라 JWT env와 분리한다 — auth/jwt만 쓰는
// 앱(chat 등)의 prod 파드에 TOTP_ENCRYPTION_KEY 주입을 강제하지 않기 위함.
export const env = createEnv({
  server: {
    TOTP_ENCRYPTION_KEY: z
      .string()
      .regex(/^[0-9a-f]{64}$/i)
      .default('1111111111111111111111111111111111111111111111111111111111111111'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
