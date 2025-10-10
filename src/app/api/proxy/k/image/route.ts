import { GETProxyKImageSchema } from '@/app/api/proxy/k/image/schema'
import { kHentaiClient } from '@/crawler/k-hentai'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'

export const runtime = 'edge'
const maxAge = 43200 // 12 hours

export async function GET(request: Request) {
  const url = new URL(request.url)
  const searchParams = Object.fromEntries(url.searchParams)
  const validation = GETProxyKImageSchema.safeParse(searchParams)

  if (!validation.success) {
    return new Response('Bad Request', { status: 400 })
  }

  const { id } = validation.data

  try {
    const images = await kHentaiClient.fetchMangaImages({ id })

    return Response.json(images, {
      headers: {
        'Cache-Control': createCacheControl({
          public: true,
          maxAge: maxAge - 300,
          sMaxAge: maxAge - 300,
          swr: 300,
        }),
      },
    })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
