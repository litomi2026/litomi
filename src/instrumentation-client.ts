import * as Sentry from '@sentry/nextjs'

import { createSentryInitOptions } from '@/monitoring/sentry/common'

Sentry.init({
  ...createSentryInitOptions({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'local',
    release: process.env.NEXT_PUBLIC_COMMIT_SHA,
    service: 'litomi-web',
  }),
  debug: false,
  sampleRate: 0.01,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
