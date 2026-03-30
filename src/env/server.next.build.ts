import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

import { env } from './client'

/**
 * Next.js build-time env validation.
 *
 * - Imported from `next.config.ts` (Node/build context only).
 * - MUST NOT be imported from client bundles.
 */
export const nextBuildEnv = createEnv({
  server: {
    // Client-side requirements
    NEXT_PUBLIC_APP_ENV: z.string().default(env.NEXT_PUBLIC_APP_ENV),
    NEXT_PUBLIC_API_ORIGIN: z.url().default(env.NEXT_PUBLIC_API_ORIGIN),
    NEXT_PUBLIC_APP_ORIGIN: z.url().default(env.NEXT_PUBLIC_APP_ORIGIN),
    NEXT_PUBLIC_COMMIT_SHA: z.string().optional(),
    NEXT_PUBLIC_EDGE_PROXY_ORIGIN: z.url().default(env.NEXT_PUBLIC_EDGE_PROXY_ORIGIN),
    NEXT_PUBLIC_IMAGE_PROXY_ORIGIN: z.url().default(env.NEXT_PUBLIC_IMAGE_PROXY_ORIGIN),
    NEXT_PUBLIC_GTM_ID: z.string().optional(),
    NEXT_PUBLIC_GTM_SCRIPT_URL: z.url().optional(),
    NEXT_PUBLIC_IOS_TESTFLIGHT_URL: z.url().optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().default(env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().default(env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),

    // Next.js server build requirements
    POSTGRES_URL: z.url().default('postgresql://test_user:test_password@localhost:5434/test_db'),
    REDIS_URL: z.url().default('redis://redis:6380'),
    SENTRY_AUTH_TOKEN: z.string().optional(),
    SENTRY_ORG: z.string().optional(),
    SENTRY_PROJECT: z.string().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
