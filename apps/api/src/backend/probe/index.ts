import { type Context, Hono } from 'hono'

import type { Env } from '@/backend/app'

import { resolveCORSOrigin } from '../utils/cors-origin'
import { getProbeStateSnapshot } from './state'

type HealthResponse = {
  status: 'ok'
  timestamp: Date
}

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

probeRoutes.get('/startup', (c) => {
  const { startupComplete } = getProbeStateSnapshot()

  if (!startupComplete) {
    const response: StartupResponse = {
      status: 'starting',
      timestamp: new Date(),
    }

    return jsonProbeResponse(c, response, 503)
  }

  const response: StartupResponse = {
    status: 'started',
    timestamp: new Date(),
  }

  return jsonProbeResponse(c, response, 200)
})

probeRoutes.get('/health', (c) => {
  const response: HealthResponse = {
    status: 'ok',
    timestamp: new Date(),
  }

  return jsonProbeResponse(c, response, 200, { allowCORS: true })
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

    return jsonProbeResponse(c, response, 503)
  }

  if (draining) {
    const response: ReadyResponse = {
      status: 'not-ready',
      reason: 'draining',
      timestamp,
    }

    return jsonProbeResponse(c, response, 503)
  }

  const response: ReadyResponse = {
    status: 'ready',
    timestamp,
  }

  return jsonProbeResponse(c, response, 200)
})

export default probeRoutes

function jsonProbeResponse<T extends object>(
  c: Context<Env>,
  body: T,
  status: 200 | 503,
  options?: { allowCORS?: boolean },
) {
  const headers: Record<string, string> = {
    'Cache-Control': 'no-store',
  }

  if (options?.allowCORS) {
    const allowedOrigin = resolveCORSOrigin(c.req.header('Origin'))

    if (allowedOrigin) {
      headers['Access-Control-Allow-Credentials'] = 'true'
      headers['Access-Control-Allow-Origin'] = allowedOrigin
      headers.Vary = 'Origin'
    }
  }

  return c.json<T>(body, { status, headers })
}
