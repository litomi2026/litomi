import { createSentryInitOptions } from '@litomi/observability'
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  ...createSentryInitOptions({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.VERCEL_ENV || 'local',
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    service: 'litomi-edge-proxy',
  }),
  debug: false,
  sampleRate: 0.1,
})
