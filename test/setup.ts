// Test setup file for Bun
// This file is automatically loaded before running tests

import { afterEach, beforeAll } from 'bun:test'
// Mock 'server-only' package to prevent errors in test environment
import { mock } from 'bun:test'
// Setup DOM environment using happy-dom
import { Window } from 'happy-dom'

process.env.SKIP_ENV_VALIDATION = 'true'
process.env.POSTGRES_URL ??= 'postgresql://test:test@localhost:5432/test'
process.env.AIVEN_POSTGRES_URL ??= 'postgresql://test:test@localhost:5432/test'
process.env.CORS_ORIGIN ??= 'http://localhost:3000'
process.env.BBATON_CLIENT_ID ??= 'test-bbaton-client-id'
process.env.BBATON_CLIENT_SECRET ??= 'test-bbaton-client-secret'
process.env.JWT_SECRET_BBATON_ATTEMPT ??= 'test-bbaton-attempt'
process.env.NEXT_PUBLIC_BACKEND_URL ??= 'http://localhost:8080'
process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??= 'test-turnstile-site-key'
process.env.NEXT_PUBLIC_CANONICAL_URL ??= 'https://example.com'
process.env.NEXT_PUBLIC_CORS_PROXY_URL ??= 'https://example.com'
process.env.JWT_SECRET_ACCESS_TOKEN ??= 'test-jwt-access'
process.env.JWT_SECRET_REFRESH_TOKEN ??= 'test-jwt-refresh'
process.env.JWT_SECRET_TRUSTED_DEVICE ??= 'test-jwt-trusted'
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ??= 'test-vapid-public'
process.env.TOTP_ENCRYPTION_KEY ??= '0'.repeat(64)
process.env.TURNSTILE_SECRET_KEY ??= 'test-turnstile-secret'
process.env.UPSTASH_KV_REST_API_TOKEN ??= 'test-upstash-token'
process.env.UPSTASH_KV_REST_API_URL ??= 'https://example.com'
process.env.VAPID_PRIVATE_KEY ??= 'test-vapid-private'

mock.module('server-only', () => ({
  // Empty module - this prevents the error from being thrown
}))

// Mock Next.js cache functions to prevent cache-related errors in tests
mock.module('next/cache', () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  revalidatePath: () => {},
  revalidateTag: () => {},
}))

// Mock @vercel/functions to prevent errors in test environment
mock.module('@vercel/functions', () => ({
  waitUntil: () => {},
}))

// Create a new window instance
const window = new Window({
  url: 'http://localhost:3000',
  width: 1024,
  height: 768,
})

// Set up global DOM objects
beforeAll(() => {
  // @ts-expect-error - Adding DOM globals
  global.window = window
  // @ts-expect-error - Adding DOM globals
  global.document = window.document
  // @ts-expect-error - Adding DOM globals
  global.navigator = window.navigator
  // @ts-expect-error - Adding DOM globals
  global.HTMLElement = window.HTMLElement
  // @ts-expect-error - Adding DOM globals
  global.customElements = window.customElements
  // @ts-expect-error - Adding DOM globals
  global.requestAnimationFrame = (callback: FrameRequestCallback) => {
    return window.setTimeout(() => callback(Date.now()), 0)
  }

  global.cancelAnimationFrame = (id: number) => {
    // @ts-expect-error - Adding DOM globals
    return window.clearTimeout(id)
  }

  // Add fetch polyfill
  // @ts-expect-error - Adding fetch global
  global.fetch = window.fetch.bind(window)
})

// Clean up after each test
afterEach(() => {
  // Clean up DOM if needed
  document.body.innerHTML = ''
})

// Extend expect matchers if needed
// You can add custom matchers here

// Suppress console errors during tests (optional)
const originalError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Filter out React warnings about act() if needed
    if (typeof args[0] === 'string' && args[0].includes('Warning: ReactDOMTestUtils.act is deprecated')) {
      return
    }
    originalError.call(console, ...args)
  }
})
