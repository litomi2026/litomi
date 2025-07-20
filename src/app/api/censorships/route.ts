import { cookies } from 'next/headers'

import { createCacheControl } from '@/crawler/proxy-utils'
import { CensorshipKey, CensorshipLevel } from '@/database/enum'
import selectCensorships from '@/sql/selectCensorships'
import { getUserIdFromAccessToken } from '@/utils/cookie'

import { GETCensorshipsSchema } from './schema'

const maxAge = 10

export type CensorshipItem = {
  id: number
  key: CensorshipKey
  value: string
  level: CensorshipLevel
  createdAt: number
}

export type GETCensorshipsResponse = {
  censorships: CensorshipItem[]
  nextCursor: { id: number; createdAt: number } | null
}

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

  if (!userId) {
    return new Response('401 Unauthorized', { status: 401 })
  }

  const url = new URL(request.url)
  const params = Object.fromEntries(url.searchParams)
  const validation = GETCensorshipsSchema.safeParse(params)

  if (!validation.success) {
    return new Response('400 Bad Request', { status: 400 })
  }

  const { cursorId, cursorTime, limit } = validation.data

  const censorshipRows = await selectCensorships({
    userId,
    limit: limit ? limit + 1 : undefined,
    cursorId: cursorId?.toString(),
    cursorTime: cursorTime ? new Date(cursorTime).toISOString() : undefined,
  })

  const cacheControl = createCacheControl({
    private: true,
    maxAge,
    staleWhileRevalidate: maxAge,
  })

  if (censorshipRows.length === 0) {
    return new Response('404 Not Found', {
      status: 404,
      headers: { 'Cache-Control': cacheControl },
    })
  }

  const hasNextPage = limit ? censorshipRows.length > limit : false
  const censorships = hasNextPage ? censorshipRows.slice(0, limit) : censorshipRows
  const lastCensorship = censorships[censorships.length - 1]
  const nextCursor = hasNextPage
    ? {
        id: lastCensorship.id,
        createdAt: lastCensorship.createdAt.getTime(),
      }
    : null

  return Response.json(
    {
      censorships: censorships.map((censorship) => ({
        ...censorship,
        createdAt: censorship.createdAt.getTime(),
      })),
      nextCursor,
    } satisfies GETCensorshipsResponse,
    { headers: { 'Cache-Control': cacheControl } },
  )
}
