import { and, desc, eq, sql } from 'drizzle-orm'

import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { CensorshipKey, CensorshipLevel } from '@/database/enum'
import { db } from '@/database/supabase/drizzle'
import { userCensorshipTable } from '@/database/supabase/schema'
import { validateUserIdFromCookie } from '@/utils/cookie'

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
  const userId = await validateUserIdFromCookie()

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
        and(eq(userCensorshipTable.userId, userId), cursor ? sql`${userCensorshipTable.id} < ${cursor}` : undefined),
      )
      .orderBy(desc(userCensorshipTable.id))
      .limit(limit + 1)

    const cacheControl = createCacheControl({
      private: true,
      maxAge: 5,
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
