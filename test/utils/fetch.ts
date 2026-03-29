import { mock } from 'bun:test'

export type FetchContext = {
  init?: FetchInit
  input: FetchInput
  method: string
  url: URL
}
export type FetchRoute = {
  matcher: FetchMatcher
  method?: string
  response: Response | ((context: FetchContext) => Promise<Response> | Response)
}

export type FetchRouteSource = FetchRoute[] | (() => FetchRoute[])

type FetchInit = Parameters<typeof fetch>[1]

type FetchInput = Parameters<typeof fetch>[0]

type FetchMatcher = string | RegExp | ((context: FetchContext) => boolean)

export function createFetchWithErrorHandlingMock(routes: FetchRouteSource) {
  return mock(async <T>(input: FetchInput, init?: FetchInit) => {
    const response = await resolveFetchResponse(routes, input, init)
    const contentType = response.headers.get('Content-Type') ?? ''

    return {
      data: contentType.includes('application/json') ? ((await response.clone().json()) as T) : (undefined as T),
      response,
    }
  })
}

export function installMockFetch(routes: FetchRouteSource) {
  const originalFetch = global.fetch
  const calls: FetchContext[] = []

  const fetchMock = mock(async (input: FetchInput, init?: FetchInit) => {
    const context = {
      input,
      init,
      method: resolveMethod(input, init),
      url: resolveUrl(input),
    }

    calls.push(context)
    return resolveFetchResponse(routes, input, init)
  })

  global.fetch = fetchMock as unknown as typeof fetch

  return {
    calls,
    fetchMock,
    restore() {
      global.fetch = originalFetch
    },
  }
}

export function jsonResponse(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  })
}

export async function resolveFetchResponse(routes: FetchRouteSource, input: FetchInput, init?: FetchInit) {
  const availableRoutes = getRoutes(routes)
  const context = {
    input,
    init,
    method: resolveMethod(input, init),
    url: resolveUrl(input),
  }

  const route = availableRoutes.find((candidate) => matchesRoute(candidate, context))
  if (!route) {
    throw new Error(`Unhandled fetch: ${context.method} ${context.url.toString()}`)
  }

  const response = typeof route.response === 'function' ? await route.response(context) : route.response
  return response.clone()
}

function getRoutes(routes: FetchRouteSource) {
  return typeof routes === 'function' ? routes() : routes
}

function matchesRoute(route: FetchRoute, context: FetchContext) {
  if (route.method && route.method.toUpperCase() !== context.method) {
    return false
  }

  if (typeof route.matcher === 'string') {
    return route.matcher === context.url.toString() || route.matcher === `${context.url.pathname}${context.url.search}`
  }

  if (route.matcher instanceof RegExp) {
    return route.matcher.test(context.url.toString())
  }

  return route.matcher(context)
}

function resolveMethod(input: FetchInput, init?: FetchInit) {
  if (init?.method) {
    return init.method.toUpperCase()
  }

  if (input instanceof Request) {
    return input.method.toUpperCase()
  }

  return 'GET'
}

function resolveUrl(input: FetchInput) {
  if (input instanceof Request) {
    return new URL(input.url)
  }

  if (input instanceof URL) {
    return input
  }

  return new URL(String(input), window.location.origin)
}
