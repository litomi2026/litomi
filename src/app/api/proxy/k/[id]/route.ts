import { kHentaiClient } from '@/crawler/k-hentai'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { Locale } from '@/translation/common'
import { RouteProps } from '@/types/nextjs'

import { GETProxyKIdSchema } from './schema'

export const runtime = 'edge'
const maxAge = 43200 // 12 hours

type Params = {
  id: string
}

export async function GET(request: Request, { params }: RouteProps<Params>) {
  const validation = GETProxyKIdSchema.safeParse(await params)

  if (!validation.success) {
    return new Response('Bad Request', { status: 400 })
  }

  const { id } = validation.data

  try {
    const manga = await kHentaiClient.fetchManga({ id, locale: Locale.KO })

    if (!manga) {
      return new Response('Not Found', { status: 404 })
    }

    return Response.json(manga, {
      headers: {
        'Cache-Control': createCacheControl({
          public: true,
          maxAge,
          sMaxAge: maxAge,
          swr: maxAge,
        }),
      },
    })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
