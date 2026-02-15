import { Hono } from 'hono'
import { z } from 'zod'

import { Env } from '@/backend'
import { zProblemValidator } from '@/backend/utils/validator'
import { createCacheControl } from '@/utils/cache-control'
import { sec } from '@/utils/format/date'
import { createImageProxyCacheKey, parseImageProxySourceURL } from '@/utils/image-proxy'

const imageProxyRoutes = new Hono<Env>()

const pathParamSchema = z.object({
  key: z.string().regex(/^[a-f0-9]{64}$/i),
})

const querySchema = z.object({
  u: z.string().min(1),
})

const SUCCESS_CACHE_CONTROL = createCacheControl({
  public: true,
  maxAge: sec('1 day'),
  sMaxAge: sec('30 days'),
  swr: sec('7 days'),
})

const NEGATIVE_CACHE_CONTROL = createCacheControl({
  public: true,
  maxAge: sec('1 minute'),
  sMaxAge: sec('2 minutes'),
})

const NO_STORE_CACHE_CONTROL = createCacheControl({
  noStore: true,
})

const REFERER_BY_HOST_SUFFIX: ReadonlyArray<{ hostSuffix: string; referer: string }> = [
  { hostSuffix: 'hiyobi.org', referer: 'https://hiyobi.org/' },
  { hostSuffix: 'k-hentai.org', referer: 'https://k-hentai.org/' },
  { hostSuffix: 'harpi.in', referer: 'https://harpi.in/' },
  { hostSuffix: 'soujpa.in', referer: 'https://harpi.in/' },
]

const FORWARDED_HEADERS = ['Content-Type', 'Content-Length', 'Last-Modified', 'ETag'] as const

const ACCEPTED_IMAGE_CONTENT_TYPES = ['application/octet-stream'] as const

function createProxyErrorResponse(message: string, status: number, cacheControl: string): Response {
  return new Response(message, {
    status,
    headers: {
      'Cache-Control': cacheControl,
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}

function isImageContentType(contentType: string | null): boolean {
  if (!contentType) {
    return true
  }

  const normalizedContentType = contentType.toLowerCase()

  if (normalizedContentType.startsWith('image/')) {
    return true
  }

  return ACCEPTED_IMAGE_CONTENT_TYPES.some((acceptedContentType) =>
    normalizedContentType.startsWith(acceptedContentType),
  )
}

function resolveReferer(hostname: string): string | undefined {
  const normalizedHost = hostname.toLowerCase()
  const matchedRule = REFERER_BY_HOST_SUFFIX.find(
    ({ hostSuffix }) => normalizedHost === hostSuffix || normalizedHost.endsWith(`.${hostSuffix}`),
  )

  return matchedRule?.referer
}

imageProxyRoutes.on(
  ['GET', 'HEAD'],
  '/v1/:key',
  zProblemValidator('param', pathParamSchema),
  zProblemValidator('query', querySchema),
  async (c) => {
    const { key } = c.req.valid('param')
    const { u } = c.req.valid('query')

    let sourceURL: URL

    try {
      sourceURL = parseImageProxySourceURL(u)
    } catch (error) {
      const message = error instanceof Error ? error.message : '잘못된 이미지 URL이에요'
      return createProxyErrorResponse(message, 400, NO_STORE_CACHE_CONTROL)
    }

    let expectedCacheKey: string

    try {
      expectedCacheKey = await createImageProxyCacheKey(sourceURL)
    } catch (error) {
      console.error('Failed to create image proxy cache key:', error)
      return createProxyErrorResponse('500 Internal Server Error', 500, NO_STORE_CACHE_CONTROL)
    }

    if (key.toLowerCase() !== expectedCacheKey) {
      return createProxyErrorResponse('400 Bad Request', 400, NO_STORE_CACHE_CONTROL)
    }

    const upstreamHeaders = new Headers({
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    })

    const userAgent = c.req.header('User-Agent')
    if (userAgent) {
      upstreamHeaders.set('User-Agent', userAgent)
    }

    const referer = resolveReferer(sourceURL.hostname)
    if (referer) {
      upstreamHeaders.set('Referer', referer)
    }

    let upstreamResponse: Response

    try {
      upstreamResponse = await fetch(sourceURL, {
        method: c.req.method === 'HEAD' ? 'HEAD' : 'GET',
        headers: upstreamHeaders,
        redirect: 'follow',
      })
    } catch (error) {
      console.error('Failed to fetch upstream image:', error)
      return createProxyErrorResponse('502 Bad Gateway', 502, NEGATIVE_CACHE_CONTROL)
    }

    if (!upstreamResponse.ok) {
      return createProxyErrorResponse(
        `${upstreamResponse.status} ${upstreamResponse.statusText || 'Upstream Error'}`,
        upstreamResponse.status,
        NEGATIVE_CACHE_CONTROL,
      )
    }

    if (!isImageContentType(upstreamResponse.headers.get('Content-Type'))) {
      return createProxyErrorResponse('415 Unsupported Media Type', 415, NEGATIVE_CACHE_CONTROL)
    }

    const responseHeaders = new Headers({
      'Cache-Control': SUCCESS_CACHE_CONTROL,
    })

    FORWARDED_HEADERS.forEach((header) => {
      const value = upstreamResponse.headers.get(header)
      if (value) {
        responseHeaders.set(header, value)
      }
    })

    return new Response(c.req.method === 'HEAD' ? null : upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    })
  },
)

export default imageProxyRoutes
