import type { NextConfig } from 'next'

import { withSentryConfig } from '@sentry/nextjs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const isProduction = process.env.NODE_ENV === 'production'
const configDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(configDir, '..')

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  turbopack: {
    // Avoid workspace root inference when multiple lockfiles exist.
    // Set to monorepo root so `tsconfig` extends and `@/*` paths resolve.
    root: repoRoot,
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
