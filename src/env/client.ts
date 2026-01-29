export const env = {
  // Local dev defaults
  NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080',
  NEXT_PUBLIC_CANONICAL_URL: process.env.NEXT_PUBLIC_CANONICAL_URL ?? 'http://localhost:3000',

  // Optional / feature toggles (empty by default)
  NEXT_PUBLIC_CORS_PROXY_URL: process.env.NEXT_PUBLIC_CORS_PROXY_URL ?? '',
  NEXT_PUBLIC_EXTERNAL_API_PROXY_URL: process.env.NEXT_PUBLIC_EXTERNAL_API_PROXY_URL ?? 'http://localhost:3000',
  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID ?? '',
  NEXT_PUBLIC_IOS_TESTFLIGHT_URL: process.env.NEXT_PUBLIC_IOS_TESTFLIGHT_URL ?? '',
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN ?? '',

  // Required for core features (provide safe local/test defaults)
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA',
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '123',
} as const
