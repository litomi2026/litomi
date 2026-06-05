import { closeRedis, pingRedis } from '@litomi/db/redis'

import { shutdownAnalyticsClient } from './api/v1/analytics/realtime'
import app from './app'
import { initBackendOtel, shutdownBackendOtel } from './otel'
import { markProbeDraining, markProbeStartupComplete } from './probe/state'
import { registerShutdownHandler, registerShutdownSignals } from './shutdown'

initBackendOtel()

const server = Bun.serve({
  fetch: app.fetch,
  hostname: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',
  port: Number(process.env.PORT ?? 3002),
})

registerShutdownHandler('probe', () => markProbeDraining())
registerShutdownHandler('http-server', () => server.stop())
registerShutdownHandler('redis', () => closeRedis())
registerShutdownHandler('google-analytics', () => shutdownAnalyticsClient())
registerShutdownHandler('opentelemetry', () => shutdownBackendOtel())
registerShutdownSignals()

await pingRedis()
markProbeStartupComplete()

console.info(`litomi api listening on http://${server.hostname}:${server.port}`)
