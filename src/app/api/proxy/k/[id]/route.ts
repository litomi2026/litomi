import { KHentaiClient } from '@/crawler/k-hentai'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { RouteProps } from '@/types/nextjs'

import { GETProxyKIdSchema } from './schema'

export const runtime = 'edge'
const maxAge = 43200 // 12 hours

type Params = {
  id: string
}

export async function GET(request: Request, props: RouteProps<Params>) {
  const params = await props.params
  const validation = GETProxyKIdSchema.safeParse(params)

  if (!validation.success) {
    return new Response('400 Bad Request', { status: 400 })
  }

  const { id } = validation.data
  const client = KHentaiClient.getInstance()

  try {
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
