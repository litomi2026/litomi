/**
 * Cloudflare Worker - CORS Image Proxy (TypeScript version)
 *
 * This worker fetches images from external sources and adds CORS headers
 * to allow browser access from your domain.
 */

// Cloudflare Worker types

export interface Env {
  // Dummy property to satisfy TypeScript linter
  // This won't affect the worker functionality
  _dummy?: string
  // Add any environment variables or bindings here
}

interface ExecutionContext {
  passThroughOnException(): void
  waitUntil(promise: Promise<unknown>): void
}

// List of allowed image source domains
const ALLOWED_DOMAINS = [
  'cdn.harpi.in',
  'thumb.k-hentai.org',
  'k-hentai.org',
  'api-kh.hiyobi.org',
  'ehgt.org',
  // Add more domains as needed
] as const

// List of allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://litomi.vercel.app',
  'https://litomi-git-stage-team2837.vercel.app',
  'http://localhost:3000',
] as const

// Image content types
const IMAGE_CONTENT_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
] as const

/**
 * Creates an error response with CORS headers
 */
function errorResponse(message: string, status: number, origin: string | null): Response {
  return new Response(message, {
    status,
    headers: getCorsHeaders(origin),
  })
}

/**
 * Gets CORS headers with the appropriate origin
 */
function getCorsHeaders(origin: string | null): HeadersInit {
  // Check if the origin is allowed
  const corsOrigin = origin && ALLOWED_ORIGINS.some((allowed) => allowed === origin) ? origin : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Cache-Control': 'public, max-age=43200', // 12 hours cache for images
  }
}

/**
 * Validates if the URL is from an allowed domain
 */
function isAllowedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname
    return ALLOWED_DOMAINS.some((domain) => hostname === domain || hostname.endsWith('.' + domain))
  } catch {
    return false
  }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: getCorsHeaders(request.headers.get('Origin')) })
    }

    // Only allow GET and HEAD requests
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return errorResponse('Method not allowed', 405, request.headers.get('Origin'))
    }

    try {
      const url = new URL(request.url)
      const imageUrl = url.searchParams.get('url')

      // Validate image URL parameter
      if (!imageUrl) {
        return errorResponse('Missing url parameter', 400, request.headers.get('Origin'))
      }

      // Validate URL format
      let targetUrl: URL
      try {
        targetUrl = new URL(imageUrl)
        // Only allow HTTPS for security
        if (targetUrl.protocol !== 'https:') {
          return errorResponse('Only HTTPS URLs are allowed', 400, request.headers.get('Origin'))
        }
      } catch {
        return errorResponse('Invalid URL format', 400, request.headers.get('Origin'))
      }

      // Check if domain is allowed
      if (!isAllowedDomain(imageUrl)) {
        return errorResponse('Domain not allowed', 403, request.headers.get('Origin'))
      }

      // Prepare headers for the upstream request
      const upstreamHeaders: HeadersInit = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      }

      // Add referer based on the domain
      const hostname = targetUrl.hostname
      if (hostname.includes('hiyobi')) {
        upstreamHeaders['Referer'] = 'https://hiyobi.org'
      } else if (hostname.includes('k-hentai')) {
        upstreamHeaders['Referer'] = 'https://k-hentai.org'
      } else if (hostname.includes('harpi')) {
        upstreamHeaders['Referer'] = 'https://harpi.in'
      }

      // Fetch the image from the upstream server
      const imageResponse = await fetch(imageUrl, {
        method: request.method,
        headers: upstreamHeaders,
        redirect: 'follow',
        // Use Cloudflare's cache
        cf: {
          cacheTtl: 43200, // 12 hours
          cacheEverything: true,
        },
      } as RequestInit)

      // Check if the response is successful
      if (!imageResponse.ok) {
        return errorResponse(
          `Upstream server error: ${imageResponse.status}`,
          imageResponse.status,
          request.headers.get('Origin'),
        )
      }

      // Validate content type
      const contentType = imageResponse.headers.get('Content-Type')
      if (contentType && !IMAGE_CONTENT_TYPES.some((type) => contentType.startsWith(type))) {
        return errorResponse('Invalid content type - not an image', 400, request.headers.get('Origin'))
      }

      // Create response headers with CORS headers
      const responseHeaders = new Headers(getCorsHeaders(request.headers.get('Origin')))

      // Forward useful headers from upstream
      const headersToForward = ['Content-Type', 'Content-Length', 'Last-Modified', 'ETag'] as const

      headersToForward.forEach((header) => {
        const value = imageResponse.headers.get(header)
        if (value) {
          responseHeaders.set(header, value)
        }
      })

      // Return the image with CORS headers
      return new Response(imageResponse.body, {
        status: imageResponse.status,
        headers: responseHeaders,
      })
    } catch (error) {
      console.error('Proxy error:', error)
      return errorResponse('Internal server error', 500, request.headers.get('Origin'))
    }
  },
}
