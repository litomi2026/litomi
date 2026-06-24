import { mock } from 'bun:test'
import type { FetchContext, FetchRoute, FetchRouteSource } from '@test/utils/fetch'
import { jsonResponse } from '@test/utils/fetch'

type FetchInit = Parameters<typeof fetch>[1]
type FetchInput = Parameters<typeof fetch>[0]

const LOCAL_HOSTS = new Set(['127.0.0.1', '::1', '[::1]', 'localhost'])

export { jsonResponse }

export function externalRoute(route: FetchRoute): FetchRoute {
  return route
}

export function installExternalFetchGuard(routes: FetchRouteSource) {
  const originalFetch = global.fetch
  const calls: FetchContext[] = []

  const fetchMock = mock(async (input: FetchInput, init?: FetchInit) => {
    const context = createFetchContext(input, init)

    if (shouldPassthrough(context.url)) {
      return await originalFetch(input, init)
    }

    calls.push(context)
    return await resolveExternalFetchResponse(routes, context)
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

function createFetchContext(input: FetchInput, init?: FetchInit): FetchContext {
  return {
    input,
    init,
    method: resolveMethod(input, init),
    url: resolveUrl(input),
  }
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

async function resolveExternalFetchResponse(routes: FetchRouteSource, context: FetchContext) {
  const route = getRoutes(routes).find((candidate) => matchesRoute(candidate, context))

  if (!route) {
    throw new Error(`Unhandled external fetch: ${context.method} ${context.url.toString()}`)
  }

  const response = typeof route.response === 'function' ? await route.response(context) : route.response
  return response.clone()
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

  return new URL(String(input), 'http://localhost')
}

function shouldPassthrough(url: URL) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return false
  }

  return LOCAL_HOSTS.has(url.hostname)
}
