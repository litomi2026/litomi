import './instrumentation'

import { registerShutdownHandler, registerShutdownSignals } from '@litomi/std'

import app from './app'
import { shutdownBackendOtel } from './otel'

const server = Bun.serve({
  fetch: app.fetch,
  hostname: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',
  idleTimeout: 30,
  port: Number(process.env.PORT ?? 3001),
})

registerShutdownHandler('http-server', () => server.stop())
registerShutdownHandler('opentelemetry', () => shutdownBackendOtel())
registerShutdownSignals()

console.info(`litomi-proxy listening on http://${server.hostname}:${server.port}`)
