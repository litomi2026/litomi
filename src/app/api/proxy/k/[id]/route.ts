import { NextRequest } from 'next/server'

import { KHentaiClient } from '@/crawler/k-hentai'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'

export const runtime = 'edge'
const maxAge = 43200 // 12 hours

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id)

  if (isNaN(id) || id <= 0) {
    return new Response('400 Bad Request', { status: 400 })
  }

  try {
    const client = KHentaiClient.getInstance()
    const manga = await client.fetchManga(id)

    if (!manga) {
      return new Response('404 Not Found', { status: 404 })
    }

    return Response.json(manga, {
      headers: {
        'Cache-Control': createCacheControl({
          public: true,
          maxAge: maxAge - 300,
          sMaxAge: maxAge - 300,
          staleWhileRevalidate: 300,
        }),
      },
    })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
