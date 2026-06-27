import type { ErrorEvent, RequestEventData, StackFrame } from '@sentry/core'

const REDACTED_TEXT = '[REDACTED]'
const SENSITIVE_REQUEST_HEADER_NAMES = new Set(['authorization', 'cookie', 'set-cookie'])

type BaseSentryInitOptions = {
  beforeSend: (event: ErrorEvent) => ErrorEvent | null
  dsn?: string
  enabled: boolean
  environment?: string
  initialScope: {
    tags: {
      service: string
    }
  }
  release?: string
  sendDefaultPii: true
}

type SharedSentryOptions = {
  dsn?: string
  environment?: string
  release?: string
  service: string
}

export function createSentryInitOptions({
  dsn,
  environment,
  release,
  service,
}: SharedSentryOptions): BaseSentryInitOptions {
  return {
    dsn,
    enabled: Boolean(dsn),
    environment,
    release,
    sendDefaultPii: true,
    beforeSend: scrubSentryEvent,
    initialScope: { tags: { service } },
  }
}

export function scrubSentryEvent(event: ErrorEvent): ErrorEvent | null {
  if (event.request) {
    const request = event.request as Record<string, unknown> & RequestEventData

    request.cookies = sanitizeRequestCookies(request.cookies)
    request.headers = sanitizeRequestHeaders(request.headers)

    if (request.data !== undefined) {
      request.data = REDACTED_TEXT
    }

    if (request.body !== undefined) {
      request.body = REDACTED_TEXT
    }

    if (request.payload !== undefined) {
      request.payload = REDACTED_TEXT
    }

    event.request = request
  }

  return event
}

function sanitizeRequestCookies(cookies: RequestEventData['cookies']): RequestEventData['cookies'] {
  if (!cookies) {
    return cookies
  }

  const sanitizedCookies: Record<string, string> = {}

  for (const key of Object.keys(cookies)) {
    sanitizedCookies[key] = REDACTED_TEXT
  }

  return sanitizedCookies
}

function sanitizeRequestHeaders(headers: RequestEventData['headers']): RequestEventData['headers'] {
  if (!headers) {
    return headers
  }

  const sanitizedHeaders: Record<string, string> = {}

  for (const [key, value] of Object.entries(headers)) {
    sanitizedHeaders[key] = SENSITIVE_REQUEST_HEADER_NAMES.has(key.toLowerCase()) ? REDACTED_TEXT : value
  }

  return sanitizedHeaders
}

/** Exception message patterns that are always third-party browser noise. */
export const SENTRY_BROWSER_IGNORE_ERRORS: (string | RegExp)[] = [
  // Browser-extension content scripts reference the WebExtension API
  // e.g. "undefined is not an object (evaluating 'browser.runtime.onMessage.addListener')".
  /\b(?:browser|chrome)\.runtime\b/i,
  // e.g. "Invalid call to runtime.sendMessage(). Tab not found."
  /\bruntime\.sendMessage\b/i,
  'Extension context invalidated',
  // ResizeObserver 콜백이 또 리사이즈를 유발해 한 프레임 안에 알림을 다 못 보낼 때 브라우저가 띄우는 경고
  /ResizeObserver loop (?:limit exceeded|completed with undelivered notifications)/i,
  // iOS in-app/WebKit browsers (Brave, Firefox) inject a `window.__firefox__` global helper. Errors touching it
  // surface as a single `app:///<route>:1:NN (global code)` frame, so they look first-party and slip the URL filters.
  // e.g. "undefined is not an object (evaluating 'window.__firefox__.reader')", "Can't find variable: __firefox__".
  /__firefox__/,
  // Crypto-wallet extensions inject `window.ethereum` / `window.web3` providers and collide with each other.
  // e.g. "undefined is not an object (evaluating 'window.ethereum.selectedAddress = undefined')".
  /\bwindow\.ethereum\b|\bethereum\.selectedAddress\b|\bwindow\.web3\b/i,
  // Grafana Faro web-sdk's session manager reads web storage (`window[type]`) to persist RUM sessions. On
  // storage-restricted iOS Safari (Lockdown/private mode, embedded webviews) `window[type]` is null and Faro
  // SDK throws from a throttled setTimeout callback.
  // e.g. "null is not an object (evaluating 'window[t].getItem')".
  /(?:null|undefined) is not an object \(evaluating 'window\[\w+\]\.(?:get|set|remove)Item'\)/,
  // Android in-app WebViews (KakaoTalk, Naver, WeChat, etc.) expose a native JS↔Java bridge via
  // addJavascriptInterface and fire lifecycle hooks into the page. The Android framework throws
  // "Java bridge method invocation error" when that reflective call fails — it is emitted by the host app's
  // WebView and has no code path in a pure web app, so matching the message can never hide a first-party bug.
  /Java bridge method invocation/i,
]

/** Foreign script-URL patterns: browser extensions and page-injected third parties whose originating script is not ours. */
export const SENTRY_BROWSER_DENY_URLS: RegExp[] = [
  // Browser extensions injected into the page.
  /^(?:chrome|moz|safari)(?:-(?:web-)?extension)?:\/\//i,
  // Third-party script that monkey-patches window.fetch on some users' pages
  /injectScriptAdjust/i,
  // Google Tag Manager / Analytics throw from inside Google's own gtm.js / analytics.js bundles. Our code is never
  // served from these hosts, so dropping by script URL (unlike a message filter) cannot hide a first-party error.
  /googletagmanager\.com|google-analytics\.com/i,
]

/** External request hosts whose fetch/network failures are third-party noise */
export const SENTRY_BROWSER_IGNORED_REQUEST_HOSTS: (string | RegExp)[] = [
  // hiyobi external manga-source API (e.g. the HiyobiPing health check)
  'api-kh.hiyobi.org',
]

const NETWORK_ERROR_MESSAGE = /Failed to fetch|Load failed|NetworkError when attempting to fetch|fetch failed/i

// CSP blocking eval()/new Function(). Foreign (injected) eval is noise; a first-party dep tripping our CSP is real.
const CSP_EVAL_BLOCKED_MESSAGE = /Evaluating a string as JavaScript|Refused to evaluate a string as JavaScript/i

// Our application bundle is served under the app:/// scheme at send time
const FIRST_PARTY_FRAME = /^app:\/\/\//i

// Any frame that resolves to a real downloaded script
const REMOTE_SCRIPT_URL = /^https?:\/\//i

function isForeignScriptURL(url: string): boolean {
  return SENTRY_BROWSER_DENY_URLS.some((pattern) => pattern.test(url))
}

function getFrameURL(frame: StackFrame): string {
  return frame.filename ?? frame.abs_path ?? frame.module ?? ''
}

function getEventFrames(event: ErrorEvent): StackFrame[] {
  return event.exception?.values?.flatMap((value) => value.stacktrace?.frames ?? []) ?? []
}

function getEventMessage(event: ErrorEvent): string {
  const messages = [event.message, ...(event.exception?.values?.map((value) => value.value) ?? [])]
  return messages.filter((message): message is string => Boolean(message)).join(' ')
}

function isUnhandled(event: ErrorEvent): boolean {
  return event.exception?.values?.some((value) => value.mechanism?.handled === false) ?? false
}

function getEventRequestURLs(event: ErrorEvent): string {
  const urls = [event.request?.url, ...(event.breadcrumbs?.map((crumb) => crumb.data?.url) ?? [])]
  return urls.filter((url): url is string => typeof url === 'string').join(' ')
}

function referencesIgnoredRequestHost(event: ErrorEvent): boolean {
  const haystack = `${getEventMessage(event)} ${getEventRequestURLs(event)}`

  return SENTRY_BROWSER_IGNORED_REQUEST_HOSTS.some((host) =>
    typeof host === 'string' ? haystack.includes(host) : host.test(haystack),
  )
}

/** Inline / injected foreign scripts - in-app browser helpers, extensions, userscripts and `javascript:` handlers */
function isInjectedScriptError(event: ErrorEvent): boolean {
  if (!isUnhandled(event)) {
    return false
  }

  const frames = getEventFrames(event)
  if (frames.length === 0) {
    return false
  }

  // Injected/inline scripts have neither our (app:///) nor a named third-party file (http/https).
  return frames.every((frame) => {
    const url = getFrameURL(frame)
    return !FIRST_PARTY_FRAME.test(url) && !REMOTE_SCRIPT_URL.test(url)
  })
}

/** True when any frame is our own bundle (app:///) and not a foreign script masquerading under that scheme. */
function hasFirstPartyFrame(frames: StackFrame[]): boolean {
  return frames.some((frame) => {
    const url = getFrameURL(frame)
    return FIRST_PARTY_FRAME.test(url) && !isForeignScriptURL(url)
  })
}

function isAdFillRejectionNoise(event: ErrorEvent): boolean {
  const serialized = event.extra?.__serialized__ as { message?: unknown } | undefined
  return typeof serialized?.message === 'string' && /\bad data is empty\b/i.test(serialized.message)
}

export function isBrowserNoiseEvent(event: ErrorEvent): boolean {
  const frames = getEventFrames(event)

  if (isAdFillRejectionNoise(event)) {
    return true
  }

  if (frames.some((frame) => isForeignScriptURL(getFrameURL(frame)))) {
    return true
  }

  if (isInjectedScriptError(event)) {
    return true
  }

  // CSP blocked eval() — drop ONLY when it came from a foreign/injected script (no first-party frame)
  if (CSP_EVAL_BLOCKED_MESSAGE.test(getEventMessage(event)) && !hasFirstPartyFrame(frames)) {
    return true
  }

  if (NETWORK_ERROR_MESSAGE.test(getEventMessage(event))) {
    // unhandled network error with no first-party frame = a foreign script's failed fetch, not ours
    if (isUnhandled(event) && !hasFirstPartyFrame(frames)) {
      return true
    }

    // upstream API/CDN outages, ad-blocked pings
    if (referencesIgnoredRequestHost(event)) {
      return true
    }
  }

  return false
}
