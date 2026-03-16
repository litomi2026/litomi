import type { ValidationTargets } from 'hono'

import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

import { Env } from '@/backend'
import { createCacheControl } from '@/utils/cache-control'
import { sec } from '@/utils/format/date'
import { isAllowedMangaImageProxySource, parseImageProxySourceURL } from '@/utils/image-proxy'

const imageProxyRoutes = new Hono<Env>()

const pathParamSchema = z.object({
  mangaId: z.coerce.number().int().positive(),
  page: z.coerce.number().int().positive(),
  variant: z.enum(['original', 'thumbnail']),
})

const querySchema = z.object({
  u: z.string().min(1).optional(),
})

const SUCCESS_CACHE_CONTROL = createCacheControl({
  public: true,
  maxAge: sec('30 days'),
  sMaxAge: sec('30 days'),
  swr: sec('7 days'),
})

const NEGATIVE_CACHE_CONTROL = createCacheControl({
  public: true,
  maxAge: sec('1 minute'),
  sMaxAge: sec('1 minute'),
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

imageProxyRoutes.on(
  ['GET', 'HEAD'],
  '/manga/:mangaId/:variant/:page',
  zNoStoreValidator('param', pathParamSchema),
  zNoStoreValidator('query', querySchema),
  async (c) => {
    const { mangaId, page, variant } = c.req.valid('param')
    const { u } = c.req.valid('query')

    if (!u) {
      return createProxyErrorResponse('404 Not Found', 404, NO_STORE_CACHE_CONTROL)
    }

    let sourceURL: URL

    try {
      sourceURL = parseImageProxySourceURL(u)
    } catch (error) {
      console.error('Failed to parse image URL:', error)
      return createProxyErrorResponse('잘못된 이미지 URL이에요', 400, NO_STORE_CACHE_CONTROL)
    }

    if (!isAllowedMangaImageProxySource(sourceURL, { mangaId, page, variant })) {
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

    const responseHeaders = new Headers({ 'Cache-Control': SUCCESS_CACHE_CONTROL })

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

function zNoStoreValidator<Target extends keyof ValidationTargets, Schema extends Parameters<typeof zValidator>[1]>(
  target: Target,
  schema: Schema,
) {
  return zValidator(target, schema, (result) => {
    if (!result.success) {
      return createProxyErrorResponse('400 Bad Request', 400, NO_STORE_CACHE_CONTROL)
    }
  })
}
