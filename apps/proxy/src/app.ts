import { Hono } from 'hono'
import { compress } from 'hono/compress'

import { handleHiyobiNewProxy } from './routes/hiyobi-new'
import { handleKSearchProxy } from './routes/k-search'
import { handleMangaProxy } from './routes/manga'

const app = new Hono()

app.use(compress())

// Cloud Run / 로드밸런서 상태 검사
app.get('/health', () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } }))

app.get('/api/proxy/manga/:id', handleMangaProxy)
app.get('/api/proxy/hiyobi/new', handleHiyobiNewProxy)
app.get('/api/proxy/k/search', handleKSearchProxy)

export default app
