import { NextRequest } from 'next/server'

import { HiyobiClient } from '@/crawler/hiyobi'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'

export const runtime = 'edge'
const maxAge = 604800 // 1 week

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id)

  if (isNaN(id) || id <= 0) {
    return new Response('400 Bad Request', { status: 400 })
  }

  try {
    const client = HiyobiClient.getInstance()
    const manga = await client.fetchManga(id, maxAge)

    if (!manga) {
      return new Response('404 Not Found', { status: 404 })
    }

    return Response.json(manga, {
      headers: {
        'Cache-Control': createCacheControl({
          public: true,
          maxAge: maxAge,
          sMaxAge: maxAge,
          staleWhileRevalidate: maxAge,
        }),
      },
    })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
