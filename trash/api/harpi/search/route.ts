import { harpiClient } from '@/crawler/harpi/harpi'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { Locale } from '@/translation/common'
import { Manga } from '@/types/manga'

import { HarpiSearchSchema } from './schema'

export const runtime = 'edge'
const maxAge = 300

const commaJoinedParams = ['authors', 'groups', 'series', 'characters', 'tags', 'tagsExclude', 'ids']
const spaceConcatenatedParams = ['searchText', 'lineText']

export type GETProxyHarpiSearchResponse = {
  mangas: Manga[]
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const searchParams = url.searchParams
  const params: Record<string, string | string[]> = {}

  for (const [key, value] of searchParams) {
    if (commaJoinedParams.includes(key)) {
      if (params[key]) {
        if (Array.isArray(params[key])) {
          params[key].push(value)
        } else {
          params[key] = [params[key], value]
        }
      } else {
        params[key] = value
      }
    } else if (spaceConcatenatedParams.includes(key)) {
      if (params[key]) {
        params[key] = `${params[key]} ${value}`
      } else {
        params[key] = value
      }
    } else {
      params[key] = value
    }
  }

  const validation = HarpiSearchSchema.safeParse(params)

  if (!validation.success) {
    return new Response('Bad Request', { status: 400 })
  }

  const validatedParams = validation.data

  try {
    const mangas = await harpiClient.searchMangas(validatedParams, Locale.KO)

    if (!mangas) {
      return new Response('Not Found', { status: 404 })
    }

    return Response.json({ mangas } satisfies GETProxyHarpiSearchResponse, {
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
