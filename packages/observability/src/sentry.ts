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
]

/** Foreign script-URL patterns: browser extensions and page-injected third parties whose originating script is not ours. */
export const SENTRY_BROWSER_DENY_URLS: RegExp[] = [
  // Browser extensions injected into the page.
  /^(?:chrome|moz|safari)(?:-(?:web-)?extension)?:\/\//i,
  // Third-party script that monkey-patches window.fetch on some users' pages
  /injectScriptAdjust/i,
]

/** External request hosts whose fetch/network failures are third-party noise */
export const SENTRY_BROWSER_IGNORED_REQUEST_HOSTS: (string | RegExp)[] = [
  // hiyobi external manga-source API (e.g. the HiyobiPing health check)
  'api-kh.hiyobi.org',
]

const NETWORK_ERROR_MESSAGE = /Failed to fetch|Load failed|NetworkError when attempting to fetch|fetch failed/i

// Our application bundle is served under the app:/// scheme at send time
const FIRST_PARTY_FRAME = /^app:\/\/\//i

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

export function isBrowserNoiseEvent(event: ErrorEvent): boolean {
  const frames = getEventFrames(event)

  if (frames.some((frame) => isForeignScriptURL(getFrameURL(frame)))) {
    return true
  }

  if (NETWORK_ERROR_MESSAGE.test(getEventMessage(event))) {
    if (isUnhandled(event)) {
      const hasFirstPartyFrame = frames.some((frame) => {
        const url = getFrameURL(frame)
        return FIRST_PARTY_FRAME.test(url) && !isForeignScriptURL(url)
      })

      if (!hasFirstPartyFrame) {
        return true
      }
    }

    // upstream API/CDN outages, ad-blocked pings
    if (referencesIgnoredRequestHost(event)) {
      return true
    }
  }

  return false
}
