import { afterAll, beforeAll, mock } from 'bun:test'

process.env.SKIP_ENV_VALIDATION = 'true'
process.env.POSTGRES_URL ??= 'postgresql://test:test@localhost:5432/test'
process.env.AIVEN_POSTGRES_URL ??= 'postgresql://test:test@localhost:5432/test'
process.env.APP_ORIGIN ??= 'http://localhost:3000'
process.env.ADSTERRA_API_KEY ??= 'test-adsterra-api-key'
process.env.BBATON_CLIENT_ID ??= 'test-bbaton-client-id'
process.env.BBATON_CLIENT_SECRET ??= 'test-bbaton-client-secret'
process.env.JWT_SECRET_BBATON_ATTEMPT ??= 'test-bbaton-attempt'
process.env.NEXT_PUBLIC_APP_ENV ??= 'test'
process.env.NEXT_PUBLIC_API_ORIGIN ??= 'http://localhost:3002'
process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??= 'test-turnstile-site-key'
process.env.NEXT_PUBLIC_APP_ORIGIN ??= process.env.APP_ORIGIN
process.env.NEXT_PUBLIC_IMAGE_PROXY_ORIGIN ??= 'https://example.com'
process.env.NEXT_PUBLIC_EDGE_PROXY_ORIGIN ??= 'https://example.com'
process.env.NEXT_PUBLIC_EDGE_PROXY_NEW_ORIGIN ??= process.env.NEXT_PUBLIC_EDGE_PROXY_ORIGIN
process.env.JWT_SECRET_ACCESS_TOKEN ??= 'test-jwt-access'
process.env.JWT_SECRET_REFRESH_TOKEN ??= 'test-jwt-refresh'
process.env.JWT_SECRET_TRUSTED_DEVICE ??= 'test-jwt-trusted'
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ??= 'test-vapid-public'
process.env.TOTP_ENCRYPTION_KEY ??= '0'.repeat(64)
process.env.TURNSTILE_SECRET_KEY ??= 'test-turnstile-secret'
process.env.UPSTASH_KV_REST_API_TOKEN ??= 'test-upstash-token'
process.env.UPSTASH_KV_REST_API_URL ??= 'https://example.com'
process.env.VAPID_PRIVATE_KEY ??= 'test-vapid-private'

mock.module('server-only', () => ({}))

mock.module('next/cache', () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  revalidatePath: () => {},
  revalidateTag: () => {},
}))

mock.module('@vercel/functions', () => ({
  waitUntil: () => {},
}))

const originalError = console.error

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning: ReactDOMTestUtils.act is deprecated')) {
      return
    }

    originalError.call(console, ...args)
  }
})

afterAll(() => {
  mock.restore()
})
