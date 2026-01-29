import './src/env/server.next.build'

import type { NextConfig } from 'next'

import withBundleAnalyzer from '@next/bundle-analyzer'
import { withSentryConfig } from '@sentry/nextjs'

import { createCacheControl } from '@/utils/cache-control'
import { sec } from '@/utils/format/date'

const isProduction = process.env.NODE_ENV === 'production'

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https:;
  worker-src 'self' blob:;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https: http:;
  object-src 'none';
  connect-src 'self' https: http:;
  frame-src 'self' https:;
  frame-ancestors 'none';
  ${isProduction ? 'upgrade-insecure-requests;' : ''}
`

const cacheControlHeaders = [
  {
    key: 'Cache-Control',
    value: createCacheControl({
      public: true,
      maxAge: 3,
      sMaxAge: sec('1 year'),
    }),
  },
]

const bbatonCallbackCspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  object-src 'none';
  connect-src 'self' https: http:;
  frame-src 'self' https:;
  frame-ancestors 'none';
  upgrade-insecure-requests;
`

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        {
          key: 'Strict-Transport-Security',
          value: `max-age=${sec('2 years')}; includeSubDomains; preload`,
        },
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
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
        ...cacheControlHeaders,
        { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
      ],
    },
  ],
  poweredByHeader: false,
  reactCompiler: true,
  ...(process.env.BUILD_OUTPUT === 'standalone' && {
    output: 'standalone',
    transpilePackages: ['@t3-oss/env-nextjs', '@t3-oss/env-core'],
  }),
  ...(isProduction && { compiler: { removeConsole: { exclude: ['error', 'warn'] } } }),
}

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig)

export default withSentryConfig(withAnalyzer, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  // automaticVercelMonitors: true,

  telemetry: false,
})
