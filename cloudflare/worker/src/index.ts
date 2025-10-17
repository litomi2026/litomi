/**
 * Cloudflare Worker - CORS Image Proxy
 *
 * This worker fetches images from external sources and adds CORS headers
 * to allow browser access from your domain.
 */

export interface Env {
  _dummy?: string
}

interface ExecutionContext {
  passThroughOnException(): void
  waitUntil(promise: Promise<unknown>): void
}

const ALLOWED_DOMAINS = ['thumb.k-hentai.org', 'k-hentai.org', 'api-kh.hiyobi.org', 'ehgt.org', 'soujpa.in'] as const

const ALLOWED_ORIGINS = [
  'https://litomi.in',
  'https://litomi.vercel.app',
  'https://litomi.onrender.com',
  'https://litomi.netlify.app',
  'https://litomi.sherpa.software',
  'https://litomi.fly.dev',
  'https://litomi-git-stage-litomi.vercel.app',
  'http://localhost:3000',
] as const

const IMAGE_CONTENT_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/apng',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
  'application/octet-stream',
] as const

const ALLOWED_METHODS = ['GET', 'HEAD', 'OPTIONS']

const HEADERS_TO_FORWARD = ['Content-Type', 'Content-Length', 'Last-Modified', 'ETag'] as const

const CACHE_TTL = 43200 // 12 hours

function errorResponse(message: string, status: number, origin: string | null): Response {
  return new Response(message, {
    status,
    headers: getCorsHeaders(origin),
  })
}

function getCorsHeaders(origin: string | null): HeadersInit {
  const corsOrigin = origin && ALLOWED_ORIGINS.some((allowed) => allowed === origin) ? origin : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': ALLOWED_METHODS.join(', '),
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Cache-Control': `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}, immutable`,
  }
}

function isAllowedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname
    return ALLOWED_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))
  } catch {
    return false
  }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  async fetch(request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
    const origin = request.headers.get('Origin')

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: getCorsHeaders(origin) })
    }

    if (!ALLOWED_METHODS.includes(request.method)) {
      return errorResponse('405 Method Not Allowed', 405, origin)
    }

    try {
      const url = new URL(request.url).searchParams.get('url')

      if (!url) {
        return errorResponse('400 Bad Request', 400, origin)
      }

      if (!isAllowedDomain(url)) {
        return errorResponse('403 Forbidden', 403, origin)
      }

      let imageURL: URL
      try {
        imageURL = new URL(url)

        if (imageURL.protocol !== 'https:') {
          return errorResponse('400 Bad Request', 400, origin)
        }
      } catch {
        return errorResponse('400 Bad Request', 400, origin)
      }

      const requestHeaders: HeadersInit = {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.96 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        Accept: `${IMAGE_CONTENT_TYPES.join(',')},*/*;q=0.8`,
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      }

      const hostname = imageURL.hostname

      if (hostname.includes('hiyobi')) {
        requestHeaders['Referer'] = 'https://hiyobi.org/'
      } else if (hostname.includes('k-hentai')) {
        requestHeaders['Referer'] = 'https://k-hentai.org/'
      } else if (hostname.includes('harpi')) {
        requestHeaders['Referer'] = 'https://harpi.in/'
      } else if (hostname.includes('soujpa')) {
        requestHeaders['Referer'] = 'https://harpi.in/'
      }

      const imageResponse = await fetch(url, {
        method: request.method,
        headers: requestHeaders,
        redirect: 'follow',
        cf: {
          cacheTtl: 43200, // 12 hours
          cacheEverything: true,
        },
      })

      if (!imageResponse.ok) {
        return errorResponse(`${imageResponse.status} ${imageResponse.statusText}`, imageResponse.status, origin)
      }

      const contentType = imageResponse.headers.get('Content-Type')

      if (contentType && !IMAGE_CONTENT_TYPES.some((type) => contentType.startsWith(type))) {
        return errorResponse('400 Bad Request', 400, origin)
      }

      const responseHeaders = new Headers(getCorsHeaders(origin))

      HEADERS_TO_FORWARD.forEach((header) => {
        const value = imageResponse.headers.get(header)
        if (value) {
          responseHeaders.set(header, value)
        }
      })

      return new Response(imageResponse.body, {
        status: imageResponse.status,
        headers: responseHeaders,
      })
    } catch (error) {
      console.error('Proxy error:', error)
      return errorResponse('500 Internal Server Error', 500, origin)
    }
  },
}
