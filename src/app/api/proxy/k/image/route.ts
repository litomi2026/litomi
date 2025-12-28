import { GETProxyKImageSchema } from '@/app/api/proxy/k/image/schema'
import { kHentaiClient } from '@/crawler/k-hentai'
import { createCacheControl, createProblemDetailsResponse, handleRouteError } from '@/crawler/proxy-utils'
import { sec } from '@/utils/date'

export const runtime = 'edge'
const maxAge = sec('12 hours')
const swr = sec('5 minutes')

export async function GET(request: Request) {
  const url = new URL(request.url)
  const searchParams = Object.fromEntries(url.searchParams)
  const validation = GETProxyKImageSchema.safeParse(searchParams)

  if (!validation.success) {
    return createProblemDetailsResponse(request, {
      status: 400,
      code: 'bad-request',
      detail: '잘못된 요청이에요',
    })
  }

  const { id } = validation.data

  try {
    const images = await kHentaiClient.fetchMangaImages({ id })

    return Response.json(images, {
      headers: {
        'Cache-Control': createCacheControl({
          public: true,
          maxAge: maxAge - swr,
          sMaxAge: maxAge - swr,
          swr,
        }),
      },
    })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
