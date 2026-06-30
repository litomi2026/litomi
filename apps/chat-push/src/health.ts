let draining = false

export function startHealthServer() {
  return Bun.serve({
    hostname: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',
    port: Number(process.env.PORT ?? 3005),
    fetch(req) {
      const { pathname } = new URL(req.url)

      if (pathname === '/health') {
        return draining ? new Response('Server draining', { status: 503 }) : new Response('OK', { status: 200 })
      }

      return new Response('Not Found', { status: 404 })
    },
  })
}

export function markDraining() {
  draining = true
}
