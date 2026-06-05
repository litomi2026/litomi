import { CookieKey } from '@litomi/http/cookie'

import backendApp from '@/app'

type BackendRequestOptions = {
  cookies?: string | readonly string[]
  headers?: HeadersInit
  json?: unknown
  method?: string
  path: string
}

const REQUEST_IP_PORT = 3002
const REQUEST_IP_ADDRESS = '127.0.0.1'

export function getSetCookieNames(response: Response) {
  return getSetCookieStrings(response)
    .map((cookie) => normalizeSetCookieName(cookie.split(';', 1)[0]?.split('=', 1)[0]?.trim()))
    .filter((name): name is string => Boolean(name))
}

export function getSetCookieStrings(response: Response): string[] {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] }

  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie()
  }

  const value = response.headers.get('set-cookie')
  return value ? [value] : []
}

export async function requestBackend({ path, method = 'GET', headers, cookies, json }: BackendRequestOptions) {
  const requestHeaders = new Headers(headers)

  if (!requestHeaders.has('Origin')) {
    requestHeaders.set('Origin', process.env.APP_ORIGIN ?? 'http://localhost:3000')
  }

  if (!requestHeaders.has('Sec-Fetch-Site')) {
    requestHeaders.set('Sec-Fetch-Site', 'same-site')
  }

  if (cookies) {
    requestHeaders.set('Cookie', Array.isArray(cookies) ? cookies.join('; ') : (cookies as string))
  }

  const requestInit: RequestInit = {
    method,
    headers: requestHeaders,
  }

  if (json !== undefined) {
    requestHeaders.set('Content-Type', 'application/json')
    requestInit.body = JSON.stringify(json)
  }

  return await backendApp.request(path, requestInit, {
    requestIP() {
      return {
        address: REQUEST_IP_ADDRESS,
        family: 'IPv4',
        port: REQUEST_IP_PORT,
      }
    },
  })
}

export function resolveSetCookieName(name: string) {
  switch (name) {
    case 'ah':
      return CookieKey.AUTH_HINT
    case 'at':
      return CookieKey.ACCESS_TOKEN
    case 'rt':
      return CookieKey.REFRESH_TOKEN
    case 'tbt':
      return CookieKey.TRUSTED_BROWSER_TOKEN
    default:
      return name
  }
}

function normalizeSetCookieName(name: string | undefined) {
  switch (name) {
    case CookieKey.ACCESS_TOKEN:
      return 'at'
    case CookieKey.AUTH_HINT:
      return 'ah'
    case CookieKey.REFRESH_TOKEN:
      return 'rt'
    case CookieKey.TRUSTED_BROWSER_TOKEN:
      return 'tbt'
    default:
      return name
  }
}
