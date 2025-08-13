// Test setup file for Bun
// This file is automatically loaded before running tests

import { afterEach, beforeAll } from 'bun:test'
// Mock 'server-only' package to prevent errors in test environment
import { mock } from 'bun:test'
// Setup DOM environment using happy-dom
import { Window } from 'happy-dom'

mock.module('server-only', () => ({
  // Empty module - this prevents the error from being thrown
}))

// Mock Next.js unstable_cache to prevent cache-related errors in tests
mock.module('next/cache', () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn, // Return the function directly without caching in tests
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
