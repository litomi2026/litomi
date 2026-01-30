import type { NextConfig } from 'next'

import { withSentryConfig } from '@sentry/nextjs'

const isProduction = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  poweredByHeader: false,
  ...(isProduction && { compiler: { removeConsole: { exclude: ['error', 'warn'] } } }),
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
  telemetry: false,
})
