import { HiyobiClient } from '@/crawler/hiyobi'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { RouteProps } from '@/types/nextjs'

import { GETProxyHiyobiIdSchema } from './schema'

export const runtime = 'edge'
const maxAge = 604800 // 1 week

type Params = {
  id: string
}

export async function GET(request: Request, props: RouteProps<Params>) {
  const params = await props.params
  const validation = GETProxyHiyobiIdSchema.safeParse(params)

  if (!validation.success) {
    return new Response('400 Bad Request', { status: 400 })
  }

  const { id } = validation.data
  const client = HiyobiClient.getInstance()

  try {
    const manga = await client.fetchManga(id)

    if (!manga) {
      return new Response('404 Not Found', { status: 404 })
    }

    return Response.json(manga, {
      headers: {
        'Cache-Control': createCacheControl({
          public: true,
          maxAge,
          sMaxAge: maxAge,
          staleWhileRevalidate: maxAge,
        }),
      },
    })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
