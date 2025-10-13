import { and, eq } from 'drizzle-orm'
import { NextRequest } from 'next/server'
import { z } from 'zod/v4'

import { MAX_MANGA_ID } from '@/constants/policy'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { db } from '@/database/supabase/drizzle'
import { userRatingTable } from '@/database/supabase/schema'
import { RouteProps } from '@/types/nextjs'
import { validateUserIdFromCookie } from '@/utils/cookie'

export type GETMangaIdRatingResponse = {
  rating: number
  updatedAt: string
}

type Params = {
  id: string
}

const paramsSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
})

const cacheControl = createCacheControl({
  private: true,
  maxAge: 3,
})

export async function GET(request: NextRequest, { params }: RouteProps<Params>) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const validation = paramsSchema.safeParse(await params)

  if (!validation.success) {
    return new Response('Bad Request', { status: 400, headers: { 'Cache-Control': cacheControl } })
  }

  const { id: mangaId } = validation.data

  try {
    const [result] = await db
      .select({
        rating: userRatingTable.rating,
        updatedAt: userRatingTable.updatedAt,
      })
      .from(userRatingTable)
      .where(and(eq(userRatingTable.userId, userId), eq(userRatingTable.mangaId, mangaId)))

    if (!result) {
      return new Response('Not Found', { status: 404, headers: { 'Cache-Control': cacheControl } })
    }

    return Response.json(result, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
