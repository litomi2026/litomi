import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

/**
 * Next.js build-time env validation.
 *
 * - Imported from `next.config.ts` (Node/build context only).
 * - MUST NOT be imported from client bundles.
 */
export const nextBuildEnv = createEnv({
  server: {
    // Public env (validated at build-time)
    NEXT_PUBLIC_BACKEND_URL: z.url().default('http://localhost:8080'),
    NEXT_PUBLIC_CANONICAL_URL: z.url().default('http://localhost:3000'),
    NEXT_PUBLIC_CORS_PROXY_URL: z.url().optional(),
    NEXT_PUBLIC_EXTERNAL_API_PROXY_URL: z.url().default('http://localhost:3000'),
    NEXT_PUBLIC_GA_ID: z.string().optional(),
    NEXT_PUBLIC_IOS_TESTFLIGHT_URL: z.url().optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).default('1x00000000000000000000AA'),
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1).default('123'),

    // Build-time requirements
    POSTGRES_URL: z.string().default('postgresql://test_user:test_password@localhost:5434/test_db'),
    SENTRY_AUTH_TOKEN: z.string().optional(),
    SENTRY_ORG: z.string().optional(),
    SENTRY_PROJECT: z.string().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
