import { NextRequest } from 'next/server'

import { GETProxyKImageSchema } from '@/app/api/proxy/k/image/schema'
import { KHentaiClient } from '@/crawler/k-hentai'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'

export const runtime = 'edge'
const staleWhileRevalidate = 300
const maxAge = 43200 - staleWhileRevalidate

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const params = Object.fromEntries(searchParams)
  const validation = GETProxyKImageSchema.safeParse(params)

  if (!validation.success) {
    return new Response('400 Bad Request', { status: 400 })
  }

  const { id } = validation.data
  const client = KHentaiClient.getInstance()

  try {
    const images = await client.fetchMangaImages(id)

    return Response.json(images, {
      headers: {
        'Cache-Control': createCacheControl({
          public: true,
          maxAge,
          sMaxAge: maxAge,
          staleWhileRevalidate,
        }),
      },
    })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
