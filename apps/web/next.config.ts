import type { NextConfig } from 'next'

import { nextBuildEnv } from '@litomi/env/server.next.build'
import { createCacheControl } from '@litomi/http/cache-control'
import { sec } from '@litomi/std'
import withBundleAnalyzer from '@next/bundle-analyzer'
import { withSentryConfig } from '@sentry/nextjs'
import { withBotId } from 'botid/next/config'
import createNextIntlPlugin from 'next-intl/plugin'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const isProduction = process.env.NODE_ENV === 'production'
const configDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(configDir, '../..')
const commitSHA = process.env.COMMIT_SHA
const sentryDeployEnv = process.env.NEXT_PUBLIC_APP_ENV
const apiOrigin = nextBuildEnv.NEXT_PUBLIC_API_ORIGIN
const imageProxyOrigin = nextBuildEnv.NEXT_PUBLIC_IMAGE_PROXY_ORIGIN

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https:;
  script-src-attr 'none';
  worker-src 'self' blob:;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  font-src 'self' data:;
  media-src 'self' blob: data: https:;
  object-src 'none';
  connect-src 'self' https:;
  base-uri 'self';
  form-action 'self';
  frame-src 'self' https:;
  frame-ancestors 'none';
  ${isProduction ? 'upgrade-insecure-requests;' : ''}
`

const cacheControlHeaders = {
  key: 'Cache-Control',
  value: createCacheControl({
    public: true,
    maxAge: 3,
    sMaxAge: sec('1 year'),
  }),
}

const bbatonCallbackCspHeader = `
  default-src 'none';
  script-src 'self' 'unsafe-inline';
  script-src-attr 'none';
  style-src 'self' 'unsafe-inline';
  font-src 'self';
  connect-src 'self' ${apiOrigin};
  base-uri 'none';
  form-action 'none';
  frame-ancestors 'none';
  ${isProduction ? 'upgrade-insecure-requests;' : ''}
`

const serviceWorkerCspHeader = `
  default-src 'self';
  connect-src 'self' ${imageProxyOrigin};
`

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'same-origin' },
        {
          key: 'Strict-Transport-Security',
          value: `max-age=${sec('2 years')}; includeSubDomains; preload`,
        },
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), payment=(), usb=()',
        },
        {
          key: 'Content-Security-Policy',
          value: isProduction ? cspHeader.replace(/\s{2,}/g, ' ').trim() : '',
        },
      ],
    },
    {
      source: '/oauth/bbaton/callback',
      headers: [
        { key: 'Cache-Control', value: 'no-store' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        {
          key: 'Content-Security-Policy',
          value: bbatonCallbackCspHeader.replace(/\s{2,}/g, ' ').trim(),
        },
      ],
    },
    {
      source: '/sw.js',
      headers: [
        cacheControlHeaders,
        {
          key: 'Content-Security-Policy',
          value: serviceWorkerCspHeader.replace(/\s{2,}/g, ' ').trim(),
        },
      ],
    },
  ],
  poweredByHeader: false,
  reactCompiler: true,
  outputFileTracingRoot: repoRoot,
  transpilePackages: [
    '@litomi/auth',
    '@litomi/catalog',
    '@litomi/contracts',
    '@litomi/crawler',
    '@litomi/db',
    '@litomi/domain',
    '@litomi/env',
    '@litomi/http',
    '@litomi/observability',
    '@litomi/std',
    '@litomi/ui',
  ],
  ...(isProduction && {
    compiler: { removeConsole: { exclude: ['error', 'warn'] } },
  }),
  ...(commitSHA && {
    deploymentId: commitSHA,
    generateBuildId: () => commitSHA,
  }),
  ...(process.env.BUILD_OUTPUT === 'standalone' && {
    output: 'standalone',
  }),
}

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')
const withNextIntlConfig = withNextIntl(nextConfig)

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(withNextIntlConfig)

export default withSentryConfig(withBotId(withAnalyzer), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,

  ...(commitSHA && {
    release: {
      name: commitSHA,
      create: Boolean(process.env.SENTRY_AUTH_TOKEN),
      finalize: Boolean(process.env.SENTRY_AUTH_TOKEN),
      ...(sentryDeployEnv && { deploy: { env: sentryDeployEnv } }),
    },
  }),

  widenClientFileUpload: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  bundleSizeOptimizations: { excludeTracing: true },
  webpack: { treeshake: { removeDebugLogging: true } },
  telemetry: false,
})
