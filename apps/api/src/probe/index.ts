import { Hono } from 'hono'

import type { Env } from '@/app'

import { getProbeStateSnapshot } from './state'

type ReadyResponse =
  | {
      reason: 'draining' | 'starting'
      status: 'not-ready'
      timestamp: Date
    }
  | {
      status: 'ready'
      timestamp: Date
    }

type StartupResponse =
  | {
      status: 'started'
      timestamp: Date
    }
  | {
      status: 'starting'
      timestamp: Date
    }

const probeRoutes = new Hono<Env>()
const noStoreHeaders = { 'Cache-Control': 'no-store' } as const

probeRoutes.get('/startup', (c) => {
  const { startupComplete } = getProbeStateSnapshot()

  if (!startupComplete) {
    const response = {
      status: 'starting',
      timestamp: new Date(),
    } satisfies StartupResponse

    return c.json(response, { status: 503, headers: noStoreHeaders })
  }

  const response = {
    status: 'started',
    timestamp: new Date(),
  } satisfies StartupResponse

  return c.json(response, { status: 200, headers: noStoreHeaders })
})

probeRoutes.get('/health', () => {
  return new Response(null, {
    status: 204,
    headers: noStoreHeaders,
  })
})

probeRoutes.get('/api/health', () => {
  return new Response(null, {
    status: 204,
    headers: noStoreHeaders,
  })
})

probeRoutes.get('/ready', (c) => {
  const { draining, startupComplete } = getProbeStateSnapshot()
  const timestamp = new Date()

  if (!startupComplete) {
    const response = {
      status: 'not-ready',
      reason: 'starting',
      timestamp,
    } satisfies ReadyResponse

    return c.json(response, { status: 503, headers: noStoreHeaders })
  }

  if (draining) {
    const response = {
      status: 'not-ready',
      reason: 'draining',
      timestamp,
    } satisfies ReadyResponse

    return c.json(response, { status: 503, headers: noStoreHeaders })
  }

  const response = {
    status: 'ready',
    timestamp,
  } satisfies ReadyResponse

  return c.json(response, { status: 200, headers: noStoreHeaders })
})

export default probeRoutes
