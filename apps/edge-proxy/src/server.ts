import { registerShutdownHandler, registerShutdownSignals } from '@litomi/std'

import app from './app'

const server = Bun.serve({
  fetch: app.fetch,
  hostname: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',
  port: Number(process.env.PORT ?? 3001),
})

registerShutdownHandler('http-server', () => server.stop())
registerShutdownSignals()

console.info(`litomi edge-proxy listening on http://${server.hostname}:${server.port}`)
