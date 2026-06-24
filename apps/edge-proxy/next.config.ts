import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

const isProduction = process.env.NODE_ENV === 'production'
const sentryRelease = process.env.VERCEL_GIT_COMMIT_SHA
const sentryDeployEnv = process.env.VERCEL_ENV

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: [
    '@litomi/catalog',
    '@litomi/crawler',
    '@litomi/domain',
    '@litomi/env',
    '@litomi/http',
    '@litomi/observability',
    '@litomi/std',
  ],
  ...(isProduction && { compiler: { removeConsole: { exclude: ['error', 'warn'] } } }),
}

export default withSentryConfig(nextConfig, {
  org: 'litomi',
  project: 'litomi-edge-proxy',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,

  ...(sentryRelease && {
    release: {
      name: sentryRelease,
      create: Boolean(process.env.SENTRY_AUTH_TOKEN),
      finalize: Boolean(process.env.SENTRY_AUTH_TOKEN),
      ...(sentryDeployEnv && { deploy: { env: sentryDeployEnv } }),
    },
  }),

  widenClientFileUpload: true,
  bundleSizeOptimizations: {
    excludeTracing: true,
  },
  telemetry: false,
})
