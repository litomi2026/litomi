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
    const response: StartupResponse = {
      status: 'starting',
      timestamp: new Date(),
    }

    return c.json<StartupResponse>(response, { status: 503, headers: noStoreHeaders })
  }

  const response: StartupResponse = {
    status: 'started',
    timestamp: new Date(),
  }

  return c.json<StartupResponse>(response, { status: 200, headers: noStoreHeaders })
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
    const response: ReadyResponse = {
      status: 'not-ready',
      reason: 'starting',
      timestamp,
    }

    return c.json<ReadyResponse>(response, { status: 503, headers: noStoreHeaders })
  }

  if (draining) {
    const response: ReadyResponse = {
      status: 'not-ready',
      reason: 'draining',
      timestamp,
    }

    return c.json<ReadyResponse>(response, { status: 503, headers: noStoreHeaders })
  }

  const response: ReadyResponse = {
    status: 'ready',
    timestamp,
  }

  return c.json<ReadyResponse>(response, { status: 200, headers: noStoreHeaders })
})

export default probeRoutes
