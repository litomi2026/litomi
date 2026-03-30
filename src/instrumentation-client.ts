import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 0.05,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  environment: process.env.NEXT_PUBLIC_APP_ENV || 'local',
  release: process.env.NEXT_PUBLIC_COMMIT_SHA || undefined,
  sendDefaultPii: true,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
