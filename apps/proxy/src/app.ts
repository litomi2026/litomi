import { httpInstrumentationMiddleware } from '@hono/otel'
import { Hono } from 'hono'
import { compress } from 'hono/compress'

import { handleKSearchProxy } from './routes/k-search'
import { handleMangaProxy } from './routes/manga'

const app = new Hono()

// 1. 상태 검사
app.get('/health', () => {
  return new Response(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  })
})

// 2. 관측성
app.use(httpInstrumentationMiddleware({ serviceName: 'litomi-proxy' }))

// 3. 응답 변환
app.use(compress({ threshold: 1024 }))

// 4. 하위 route
app.get('/api/proxy/manga/:id', handleMangaProxy)
app.get('/api/proxy/k/search', handleKSearchProxy)

export default app
