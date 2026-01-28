import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

const skipValidation = process.env.SKIP_ENV_VALIDATION === 'true'

export const env = createEnv({
  client: {
    NEXT_PUBLIC_BACKEND_URL: z.url(),
    NEXT_PUBLIC_CANONICAL_URL: z.url().optional(),
    NEXT_PUBLIC_CORS_PROXY_URL: z.url().optional(),
    NEXT_PUBLIC_EXTERNAL_API_PROXY_URL: z.url().optional(),
    NEXT_PUBLIC_GA_ID: z.string().min(1).optional(),
    NEXT_PUBLIC_IOS_TESTFLIGHT_URL: z.url().optional(),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1),
  },
  runtimeEnv: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_CANONICAL_URL: process.env.NEXT_PUBLIC_CANONICAL_URL,
    NEXT_PUBLIC_CORS_PROXY_URL: process.env.NEXT_PUBLIC_CORS_PROXY_URL,
    NEXT_PUBLIC_EXTERNAL_API_PROXY_URL: process.env.NEXT_PUBLIC_EXTERNAL_API_PROXY_URL,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    NEXT_PUBLIC_IOS_TESTFLIGHT_URL: process.env.NEXT_PUBLIC_IOS_TESTFLIGHT_URL,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  },
  skipValidation,
  emptyStringAsUndefined: true,
})
