import { and, desc, sql } from 'drizzle-orm'
import { cookies } from 'next/headers'

import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { db } from '@/database/drizzle'
import { CensorshipKey, CensorshipLevel } from '@/database/enum'
import { userCensorshipTable } from '@/database/schema'
import { getUserIdFromAccessToken } from '@/utils/cookie'

import { GETCensorshipsSchema } from './schema'

export type CensorshipItem = {
  id: number
  key: CensorshipKey
  value: string
  level: CensorshipLevel
  createdAt: number
}

export type GETCensorshipsResponse = {
  censorships: CensorshipItem[]
  nextCursor: { id: number } | null
}

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const url = new URL(request.url)
  const params = Object.fromEntries(url.searchParams)
  const validation = GETCensorshipsSchema.safeParse(params)

  if (!validation.success) {
    return new Response('Bad Request', { status: 400 })
  }

  const { cursor, limit } = validation.data

  try {
    const censorshipRows = await db
      .select({
        id: userCensorshipTable.id,
        key: userCensorshipTable.key,
        value: userCensorshipTable.value,
        level: userCensorshipTable.level,
        createdAt: userCensorshipTable.createdAt,
      })
      .from(userCensorshipTable)
      .where(
        and(
          sql`${userCensorshipTable.userId} = ${userId}`,
          cursor ? sql`${userCensorshipTable.id} < ${cursor}` : undefined,
        ),
      )
      .orderBy(desc(userCensorshipTable.id))
      .limit(limit + 1)

    const cacheControl = createCacheControl({
      private: true,
      maxAge: 10,
    })

    if (censorshipRows.length === 0) {
      return Response.json({ censorships: [], nextCursor: null } satisfies GETCensorshipsResponse, {
        headers: { 'Cache-Control': cacheControl },
      })
    }

    const hasNextPage = limit ? censorshipRows.length > limit : false
    const censorships = hasNextPage ? censorshipRows.slice(0, limit) : censorshipRows
    const nextCursor = hasNextPage ? { id: censorshipRows[censorshipRows.length - 1].id } : null

    return Response.json(
      {
        censorships: censorships.map((row) => ({ ...row, createdAt: row.createdAt.getTime() })),
        nextCursor,
      } satisfies GETCensorshipsResponse,
      { headers: { 'Cache-Control': cacheControl } },
    )
  } catch (error) {
    return handleRouteError(error, request)
  }
}
