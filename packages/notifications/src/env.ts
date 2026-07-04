import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    VAPID_PUBLIC_KEY: z
      .string()
      .default('BE2STQk_ZAdkzk0yacENGIQQbMhz54tgMDwryE0-d_I1irGlpbBMGs9ooYJMnONCZ9jzvWIOPIiGl7V8nXCh5w4'),
    VAPID_PRIVATE_KEY: z.string().default('pL4WSwlV1gHQUYZOOq7N1oEq0Gbj-_dWnRwph1-Ju0k'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
