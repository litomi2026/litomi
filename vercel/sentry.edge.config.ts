import * as Sentry from '@sentry/nextjs'

import { createSentryInitOptions } from '@/monitoring/sentry/common'

Sentry.init({
  ...createSentryInitOptions({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.APP_ENV || process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV || 'local',
    release: process.env.COMMIT_SHA || process.env.NEXT_PUBLIC_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA,
    service: 'litomi-edge-proxy',
  }),
  debug: false,
  sampleRate: 0.1,
})
