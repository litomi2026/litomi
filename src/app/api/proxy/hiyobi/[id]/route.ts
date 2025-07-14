import { NextRequest } from 'next/server'

import { HiyobiClient } from '@/crawler/hiyobi'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'

export const runtime = 'edge'
export const revalidate = 604800 // 1 week

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id)

  if (isNaN(id) || id <= 0) {
    return new Response('Invalid manga ID', { status: 400 })
  }

  try {
    const client = HiyobiClient.getInstance()
    const manga = await client.fetchManga(id, revalidate)

    if (!manga) {
      return new Response('Manga not found', { status: 404 })
    }

    return Response.json(manga, {
      headers: {
        'Cache-Control': createCacheControl({
          public: true,
          maxAge: revalidate,
          sMaxAge: revalidate,
          staleWhileRevalidate: revalidate,
        }),
      },
    })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
