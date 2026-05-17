import { createSentryInitOptions } from '@litomi/observability'
import * as Sentry from '@sentry/nextjs'
import { initBotId } from 'botid/client/core'

initBotId({
  protect: [
    {
      path: '/api/proxy/*',
      method: 'GET',
    },
  ],
})

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
