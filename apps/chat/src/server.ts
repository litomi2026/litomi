import { closePubSub, connectPubSub } from '@litomi/kv/pubsub'
import { registerShutdownHandler, registerShutdownSignals } from '@litomi/std'
import { authenticateRequest } from './auth'
import { canAccessStream } from './entitlements'
import { encode, parseClientMessage, type SocketData } from './protocol'
import { RoomRegistry } from './rooms'

const rooms = new RoomRegistry()

// Drain flag: probes report 503 and new upgrades are rejected once shutting down,
// while existing sockets keep working until the load balancer stops routing.
let draining = false

await connectPubSub()

const server = Bun.serve<SocketData>({
  hostname: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',
  port: Number(process.env.PORT ?? 3003),
  fetch: async (req, server) => {
    const { pathname } = new URL(req.url)

    if (pathname === '/health') {
      if (draining) {
        return new Response('Server draining', { status: 503 })
      }

      return new Response('OK', { status: 200 })
    }

    if (pathname === '/ws') {
      if (draining) {
        return new Response('Server draining', { status: 503 })
      }

      const client = await authenticateRequest(req)
      if (!client) {
        return new Response('Unauthorized', { status: 401 })
      }

      const upgraded = server.upgrade(req, {
        data: {
          userId: client.userId,
          rooms: new Set<string>(),
          msgCount: 0,
          msgResetAt: Date.now() + 1000,
        } satisfies SocketData,
      })

      // On success Bun has hijacked the response; return nothing.
      return upgraded ? undefined : new Response('WebSocket upgrade failed', { status: 426 })
    }

    return new Response('Not found', { status: 404 })
  },
  websocket: {
    maxPayloadLength: 128 * 1024, // 128KB
    backpressureLimit: 1024 * 1024, // 1MB
    closeOnBackpressureLimit: true,
    open: (ws) => {
      ws.subscribe('global:system')
      ws.send(encode({ t: 'ready', userId: ws.data.userId }))
    },
    message: async (ws, raw) => {
      const now = Date.now()

      if (now > ws.data.msgResetAt) {
        ws.data.msgCount = 0
        ws.data.msgResetAt = now + 1000
      }

      ws.data.msgCount++

      if (ws.data.msgCount > 20) {
        ws.send(encode({ t: 'err', code: 'rate_limited', message: 'Too many messages' }))
        return
      }

      const message = parseClientMessage(typeof raw === 'string' ? raw : raw.toString())
      if (!message) {
        ws.send(encode({ t: 'err', code: 'bad_request', message: 'Invalid message' }))
        return
      }

      try {
        switch (message.t) {
          case 'sub':
            if (!(await canAccessStream(ws.data.userId, message.room))) {
              ws.send(encode({ t: 'err', code: 'forbidden', message: 'Not allowed to join this room' }))
              break
            }

            await rooms.subscribe(ws, message.room)
            ws.send(encode({ t: 'sub:ok', room: message.room }))
            break
          case 'unsub':
            await rooms.unsubscribe(ws, message.room)
            ws.send(encode({ t: 'unsub:ok', room: message.room }))
            break
          case 'ping':
            ws.send(encode({ t: 'pong' }))
            break
        }
      } catch (error) {
        console.error('WebSocket message handling error:', error)
        ws.send(encode({ t: 'err', code: 'internal_error', message: 'Internal Server Error' }))
      }
    },
    close: async (ws) => {
      await rooms.unsubscribeAll(ws)
    },
  },
})

rooms.start(server)

registerShutdownHandler('probe', () => {
  draining = true
})

registerShutdownHandler('http-server', async () => {
  server.publish('global:system', encode({ t: 'reconnect' }))
  await new Promise((resolve) => setTimeout(resolve, 500))
  server.stop(true)
})

registerShutdownHandler('pubsub', () => {
  closePubSub()
})

registerShutdownSignals()

console.info(`litomi chat listening on http://${server.hostname}:${server.port}`)
