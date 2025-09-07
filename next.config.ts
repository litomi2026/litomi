import type { NextConfig } from 'next'

import withBundleAnalyzer from '@next/bundle-analyzer'
import { withSentryConfig } from '@sentry/nextjs'

import { sec } from '@/utils/date'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
      ],
    },
    {
      source: '/sw.js',
      headers: [
        { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        { key: 'Cache-Control', value: `public, max-age=${sec('5 minutes')}, must-revalidate` },
        { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
      ],
    },
    {
      source: '/manifest.webmanifest',
      headers: [{ key: 'Cache-Control', value: `public, max-age=${sec('1 day')}, must-revalidate` }],
    },
  ],
  poweredByHeader: false,
  ...(process.env.BUILD_OUTPUT === 'standalone' && { output: 'standalone' }),
}

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig)

export default withSentryConfig(withAnalyzer, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'a6fe6d483c2a',
  project: 'litomi',

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
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  // automaticVercelMonitors: true,

  telemetry: false,
})
