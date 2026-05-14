import type { MiddlewareHandler } from 'hono'

import { createCacheControl } from '@litomi/http/cache-control'

export type Options = {
  allowLocalhostInNonProduction?: boolean
  allowedOrigins: readonly string[]
  blockedFetchSiteValues?: readonly string[]
  localHostnames?: readonly string[]
  localProtocols?: readonly string[]
  unauthorizedResponse?: () => Response
}

const DEFAULT_BLOCKED_FETCH_SITE_VALUES = ['cross-site', 'none'] as const
const DEFAULT_LOCAL_HOSTNAMES = ['127.0.0.1', '::1', '[::1]', 'localhost'] as const
const DEFAULT_LOCAL_PROTOCOLS = ['http:', 'https:'] as const
const DEFAULT_UNAUTHORIZED_CACHE_CONTROL = createCacheControl({ noStore: true })

type AllowedRequestInitiatorPolicy = {
  allowLocalhostInNonProduction: boolean
  allowedOriginSet: ReadonlySet<string>
  blockedFetchSiteValueSet: ReadonlySet<string>
  localHostnameSet: ReadonlySet<string>
  localProtocolSet: ReadonlySet<string>
}

export function createAllowedRequestInitiatorMiddleware({
  allowLocalhostInNonProduction = false,
  allowedOrigins,
  blockedFetchSiteValues = DEFAULT_BLOCKED_FETCH_SITE_VALUES,
  localHostnames = DEFAULT_LOCAL_HOSTNAMES,
  localProtocols = DEFAULT_LOCAL_PROTOCOLS,
  unauthorizedResponse = createDefaultUnauthorizedResponse,
}: Options): MiddlewareHandler {
  const allowedOriginSet = new Set(allowedOrigins.map(normalizeOrigin))
  const blockedFetchSiteValueSet = new Set(blockedFetchSiteValues.map((value) => value.toLowerCase()))
  const localHostnameSet = new Set(localHostnames.map((value) => value.toLowerCase()))
  const localProtocolSet = new Set(localProtocols.map((value) => value.toLowerCase()))

  return async (c, next) => {
    const policy = {
      allowLocalhostInNonProduction,
      allowedOriginSet,
      blockedFetchSiteValueSet,
      localHostnameSet,
      localProtocolSet,
    }

    if (!isAllowedRequestInitiator(c.req.raw.headers, policy)) {
      return unauthorizedResponse()
    }

    await next()
  }
}

function createDefaultUnauthorizedResponse(): Response {
  return new Response('401 Unauthorized', {
    status: 401,
    headers: {
      'Cache-Control': DEFAULT_UNAUTHORIZED_CACHE_CONTROL,
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}

function isAllowedInitiatorURL(value: string, policy: AllowedRequestInitiatorPolicy): boolean {
  let url: URL

  try {
    url = new URL(value)
  } catch {
    return false
  }

  if (policy.allowedOriginSet.has(url.origin)) {
    return true
  }

  return (
    policy.allowLocalhostInNonProduction &&
    process.env.NODE_ENV !== 'production' &&
    policy.localHostnameSet.has(url.hostname.toLowerCase()) &&
    policy.localProtocolSet.has(url.protocol.toLowerCase())
  )
}

function isAllowedRequestInitiator(headers: Headers, policy: AllowedRequestInitiatorPolicy): boolean {
  if (isBlockedByFetchMetadata(headers.get('Sec-Fetch-Site'), policy.blockedFetchSiteValueSet)) {
    return false
  }

  const origin = headers.get('Origin')
  if (origin !== null) {
    return isAllowedInitiatorURL(origin, policy)
  }

  const referer = headers.get('Referer')
  if (referer) {
    return isAllowedInitiatorURL(referer, policy)
  }

  return false
}

function isBlockedByFetchMetadata(fetchSite: string | null, blockedFetchSiteValueSet: ReadonlySet<string>): boolean {
  return Boolean(fetchSite && blockedFetchSiteValueSet.has(fetchSite.toLowerCase()))
}

function normalizeOrigin(origin: string): string {
  return new URL(origin).origin
}
