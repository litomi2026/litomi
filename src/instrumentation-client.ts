import * as Sentry from '@sentry/nextjs'
import { initBotId } from 'botid/client/core'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 0.1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'local',
  sendDefaultPii: true,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

initBotId({
  protect: [
    {
      // Wildcards can also be used at the end for dynamic routes
      // /team/*/activate will match
      path: '/api/*',
      method: 'POST',
    },
  ],
})
