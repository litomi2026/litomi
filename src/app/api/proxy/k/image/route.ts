import { NextRequest } from 'next/server'
import { z } from 'zod'

import { KHentaiClient } from '@/crawler/k-hentai'
import { createCacheControl, handleError } from '@/crawler/proxy-utils'

export const runtime = 'edge'
export const revalidate = 43200 // 12 hours

const MangaImageSchema = z.object({
  id: z.coerce.number().positive(),
})

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const params = Object.fromEntries(searchParams)
  const validation = MangaImageSchema.safeParse(params)

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
          sMaxAge: revalidate,
          staleWhileRevalidate: revalidate,
        }),
      },
    })
  } catch (error) {
    return handleError(error, request)
  }
}
