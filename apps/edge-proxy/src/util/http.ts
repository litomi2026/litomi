import { env } from '@litomi/env/client'

const { NEXT_PUBLIC_APP_ORIGIN } = env
const ACCESS_CONTROL_ALLOW_ORIGIN = 'Access-Control-Allow-Origin'

export function createProxyHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init)
  headers.set(ACCESS_CONTROL_ALLOW_ORIGIN, NEXT_PUBLIC_APP_ORIGIN)
  return headers
}

export function withProxyHeaders(response: Response): Response {
  response.headers.set(ACCESS_CONTROL_ALLOW_ORIGIN, NEXT_PUBLIC_APP_ORIGIN)
  return response
}
