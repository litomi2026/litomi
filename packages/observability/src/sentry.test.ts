import { describe, expect, test } from 'bun:test'
import type { ErrorEvent } from '@sentry/core'

import { isBrowserNoiseEvent, SENTRY_BROWSER_DENY_URLS, SENTRY_BROWSER_IGNORE_ERRORS } from './sentry'

// Mirrors Sentry's `ignoreErrors` matching: a string pattern matches by substring,
// a RegExp matches via `.test()`, against the event message/exception value.
function messageIsDropped(message: string): boolean {
  return SENTRY_BROWSER_IGNORE_ERRORS.some((pattern) =>
    typeof pattern === 'string' ? message.includes(pattern) : pattern.test(message),
  )
}

function urlIsDenied(url: string): boolean {
  return SENTRY_BROWSER_DENY_URLS.some((pattern) => pattern.test(url))
}

function browserEvent(
  value: string,
  { handled = false, frames = [], adMessage }: { adMessage?: string; frames?: string[]; handled?: boolean } = {},
): ErrorEvent {
  return {
    exception: {
      values: [{ value, mechanism: { handled }, stacktrace: { frames: frames.map((filename) => ({ filename })) } }],
    },
    ...(adMessage ? { extra: { __serialized__: { message: adMessage } } } : {}),
  } as ErrorEvent
}

describe('SENTRY_BROWSER_IGNORE_ERRORS — drops intrinsically-foreign / non-actionable messages', () => {
  test.each([
    `undefined is not an object (evaluating 'browser.runtime.onMessage.addListener')`,
    'Invalid call to runtime.sendMessage(). Tab not found.',
    'Extension context invalidated',
    'ResizeObserver loop completed with undelivered notifications',
    'ResizeObserver loop limit exceeded',
    `undefined is not an object (evaluating 'window.__firefox__.reader')`,
    `Can't find variable: __firefox__`,
    `undefined is not an object (evaluating 'window.ethereum.selectedAddress')`,
    `undefined is not an object (evaluating 'window.web3.currentProvider')`,
    `null is not an object (evaluating 'window[t].getItem')`,
    'Error invoking invoke: Java bridge method invocation error',
  ])('drops: %s', (message) => {
    expect(messageIsDropped(message)).toBe(true)
  })
})

describe('SENTRY_BROWSER_IGNORE_ERRORS — never hides a generic error our own code could throw', () => {
  test.each([
    // our code reaching into a cross-origin iframe throws the IDENTICAL message as an ad script
    'SecurityError: Blocked a frame with origin "https://litomi.cc" from accessing a cross-origin frame.',
    // a real malformed first-party selector
    `SyntaxError: Failed to execute 'querySelectorAll' on 'Document': 'div:has(' is not a valid selector.`,
    // even one carrying a GTM-shaped substring must survive a message filter
    `SyntaxError: Failed to execute 'querySelectorAll' on 'Document': '[data-gtm=x' is not a valid selector.`,
    // JuicyAds look-alike: a real first-party null.document
    `TypeError: Cannot read properties of null (reading 'document')`,
    // real first-party web-storage bugs (the Faro filter is shape-anchored, not a bare getItem match)
    `TypeError: Cannot read properties of null (reading 'getItem')`,
    `TypeError: null is not an object (evaluating 'window[storageType].length')`,
    // bare "web3"/"runtime" tokens must not match without the global-access shape
    'ReferenceError: web3 is not defined',
    'GET https://litomi.cc/web3/guide 404',
    // CSP eval is handled stack-aware in isBrowserNoiseEvent, NOT by message text
    `EvalError: Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source`,
    // generic first-party failures
    'Error: invalid origin',
    'TypeError: this.bridge is not a function',
  ])('keeps: %s', (message) => {
    expect(messageIsDropped(message)).toBe(false)
  })
})

describe('SENTRY_BROWSER_DENY_URLS — drops by foreign script origin, never our bundle', () => {
  test.each([
    'chrome-extension://abcd/contentscript.js',
    'moz-extension://abcd/inject.js',
    'safari-web-extension://abcd/x.js',
    'https://www.googletagmanager.com/gtm.js?id=GTM-XXXX',
    'https://www.google-analytics.com/analytics.js',
  ])('denies foreign script: %s', (url) => {
    expect(urlIsDenied(url)).toBe(true)
  })

  test.each([
    'app:///_next/static/chunks/main-abc.js',
    'app:///_next/static/chunks/pages/manga/[id]-def.js',
    'https://litomi.cc/_next/static/chunks/x.js',
  ])('never denies first-party script: %s', (url) => {
    expect(urlIsDenied(url)).toBe(false)
  })
})

describe('isBrowserNoiseEvent — CSP-blocked eval is stack-aware', () => {
  test('drops a foreign/injected eval (no first-party frame)', () => {
    expect(
      isBrowserNoiseEvent(browserEvent('Refused to evaluate a string as JavaScript', { frames: ['', '<anonymous>'] })),
    ).toBe(true)
  })

  test('keeps a first-party dependency tripping our own CSP (actionable config break)', () => {
    expect(
      isBrowserNoiseEvent(
        browserEvent('Refused to evaluate a string as JavaScript', { frames: ['app:///_next/static/chunks/x.js'] }),
      ),
    ).toBe(false)
  })
})

describe('isBrowserNoiseEvent — network errors (unhandled + no first-party frame only)', () => {
  test('drops an unhandled foreign-script network failure', () => {
    expect(
      isBrowserNoiseEvent(browserEvent('TypeError: Load failed', { frames: ['', '<anonymous>'], handled: false })),
    ).toBe(true)
  })

  test('keeps an unhandled network failure that has a first-party frame (could be our fetch)', () => {
    expect(
      isBrowserNoiseEvent(
        browserEvent('TypeError: Load failed', { frames: ['app:///_next/static/chunks/page.js'], handled: false }),
      ),
    ).toBe(false)
  })

  test('keeps a handled network error (caught — may be real)', () => {
    expect(isBrowserNoiseEvent(browserEvent('TypeError: Load failed', { frames: [''], handled: true }))).toBe(false)
  })
})

describe('isBrowserNoiseEvent — other rules', () => {
  test('drops ad SDK empty-fill rejection via its serialized message', () => {
    expect(
      isBrowserNoiseEvent(browserEvent('Object captured as promise rejection', { adMessage: 'ad data is empty' })),
    ).toBe(true)
  })

  test('keeps an ordinary first-party error', () => {
    expect(
      isBrowserNoiseEvent(
        browserEvent(`TypeError: Cannot read properties of undefined (reading 'id')`, {
          frames: ['app:///_next/static/chunks/manga.js'],
          handled: false,
        }),
      ),
    ).toBe(false)
  })
})
