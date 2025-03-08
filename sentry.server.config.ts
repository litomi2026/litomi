// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://40e7a8fce2e957f313b4bbe7b9c46a2e@o4506216356511744.ingest.us.sentry.io/4508939892097024',
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'local',

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
})
