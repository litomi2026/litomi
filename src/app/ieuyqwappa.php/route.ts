import ms from 'ms'
import { NextRequest } from 'next/server'
import { createHash } from 'node:crypto'

export const runtime = 'nodejs'

const CACHE_TTL_MS = ms('5 minutes')
const UPSTREAM_TIMEOUT_MS = ms('5 seconds')
const CACHE_CONTROL_HEADER = 'max-age=120'
const INTEGRATION_BASE_URL = 'http://prscripts.com/d/?resource=pubJS'
const SW_URL = 'https://prscripts.com/d/n/sw?did=373891'
const DOMAIN_ID = '373891'
const SECRET_KEY = 'f3253736506205e2fc312526c1ab7915da6b8783894f5736458adaed7f8c0ae9'
const CREATED_TIMESTAMP = '1767181332'
const UPSTREAM_REFERER = 'https://litomi.in/'

type CacheEntry = {
  script: string
  expiresAtMs: number
}

type CacheStore = {
  main?: CacheEntry
  sw?: CacheEntry
}

declare global {
  var __plugrushIntegrationCache: CacheStore | undefined
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const cache = getCacheStore()
  const clearCache = isClearCacheAllowed(url)

  if (url.searchParams.has('created')) {
    return jsResponse(CREATED_TIMESTAMP)
  }

  if (url.searchParams.has('sw')) {
    const cached = cache.sw
    if (!clearCache && cached && !isCacheExpired(cached)) {
      return jsResponse(cached.script)
    }

    const { ok, text } = await fetchText(SW_URL, {
      'User-Agent': 'PRIntegrationScript',
      Referer: UPSTREAM_REFERER,
    })

    if (!ok) {
      return jsResponse('/* Server Issue */', 500)
    }

    cache.sw = {
      script: text,
      expiresAtMs: Date.now() + CACHE_TTL_MS,
    }

    return jsResponse(text)
  }

  const cached = cache.main
  if (!clearCache && cached && !isCacheExpired(cached)) {
    return jsResponse(cached.script)
  }

  const currentTimestamp = Math.floor(Date.now() / 1000)
  const adblockSafeHash = sha256Hex(SECRET_KEY + String(currentTimestamp))
  const integrationUrl = `${INTEGRATION_BASE_URL}&t=${currentTimestamp}&i=${adblockSafeHash}`
  const userAgent = request.headers.get('user-agent') ?? ''
  const refererHeader = request.headers.get('referer') ?? ''
  const upstreamReferer = refererHeader.includes('litomi.in') ? refererHeader : UPSTREAM_REFERER

  const { ok, text } = await fetchText(integrationUrl, {
    'User-Agent': userAgent,
    Referer: upstreamReferer,
  })

  if (!ok || !isValidDomain(text)) {
    return jsResponse('/* PlugRush: upstream unavailable */')
  }

  cache.main = {
    script: text,
    expiresAtMs: Date.now() + CACHE_TTL_MS,
  }

  return jsResponse(text)
}

async function fetchText(url: string, headers: HeadersInit): Promise<{ ok: boolean; status: number; text: string }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

  try {
    const response = await fetch(url, { headers, signal: controller.signal })
    const text = await response.text()
    return { ok: response.ok, status: response.status, text }
  } finally {
    clearTimeout(timeoutId)
  }
}

function getCacheStore(): CacheStore {
  if (!globalThis.__plugrushIntegrationCache) {
    globalThis.__plugrushIntegrationCache = {}
  }
  return globalThis.__plugrushIntegrationCache
}

function isCacheExpired(entry: CacheEntry): boolean {
  return Date.now() > entry.expiresAtMs
}

function isClearCacheAllowed(url: URL): boolean {
  const timestamp = url.searchParams.get('timestamp')
  const clearCacheHash = url.searchParams.get('clearCacheHash')

  if (!timestamp || !clearCacheHash) {
    return false
  }

  const ts = Number(timestamp)
  if (!Number.isFinite(ts)) {
    return false
  }

  const oneDayAgoSeconds = Math.floor((Date.now() - ms('1 day')) / 1000)
  if (ts <= oneDayAgoSeconds) {
    return false
  }

  const expectedHash = sha256Hex(SECRET_KEY + timestamp)
  return expectedHash === clearCacheHash
}

function isValidDomain(script: string): boolean {
  const match = /#domainIdString-(\d+)-domainIdString#/m.exec(script)
  return match?.[1] === DOMAIN_ID
}

function jsResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': CACHE_CONTROL_HEADER,
    },
  })
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
