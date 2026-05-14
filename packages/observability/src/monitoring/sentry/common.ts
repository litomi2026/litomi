import type { ErrorEvent, RequestEventData } from '@sentry/core'

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
