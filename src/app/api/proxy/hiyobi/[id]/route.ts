import { hiyobiClient } from '@/crawler/hiyobi'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { Locale } from '@/translation/common'
import { RouteProps } from '@/types/nextjs'
import { sec } from '@/utils/date'

import { GETProxyHiyobiIdSchema } from './schema'

export const runtime = 'edge'

type Params = {
  id: string
}

export async function GET(request: Request, { params }: RouteProps<Params>) {
  const validation = GETProxyHiyobiIdSchema.safeParse(await params)

  if (!validation.success) {
    return new Response('Bad Request', { status: 400 })
  }

  const { id } = validation.data

  try {
    const manga = await hiyobiClient.fetchManga({ id, locale: Locale.KO })

    if (!manga) {
      return new Response('Not Found', { status: 404 })
    }

    return Response.json(manga, {
      headers: {
        'Cache-Control': createCacheControl({
          public: true,
          maxAge: sec('12 hours'),
          sMaxAge: sec('12 hours'),
          swr: sec('5 minutes'),
        }),
      },
    })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
