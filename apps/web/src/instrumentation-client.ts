import {
  initializeFaro,
  PerformanceInstrumentation,
  SessionInstrumentation,
  ViewInstrumentation,
  WebVitalsInstrumentation,
} from '@grafana/faro-web-sdk'
import { createSentryInitOptions } from '@litomi/observability'
import * as Sentry from '@sentry/nextjs'

initializeFaro({
  app: {
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'local',
    name: 'litomi',
    version: process.env.NEXT_PUBLIC_COMMIT_SHA,
  },
  // Errors are owned by Sentry. Faro stays RUM-only (Web Vitals, sessions, views, perf)
  // to avoid double-reporting. Add @grafana/faro-web-tracing later for browser→API traces.
  instrumentations: [
    new SessionInstrumentation(),
    new ViewInstrumentation(),
    new WebVitalsInstrumentation(),
    new PerformanceInstrumentation(),
  ],
  url: process.env.NEXT_PUBLIC_FARO_URL,
})

Sentry.init({
  ...createSentryInitOptions({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'local',
    release: process.env.NEXT_PUBLIC_COMMIT_SHA,
    service: 'litomi-web',
  }),
  debug: false,
  sampleRate: 1,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
