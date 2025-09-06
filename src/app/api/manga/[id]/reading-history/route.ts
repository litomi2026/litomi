import { and, eq } from 'drizzle-orm'
import { z } from 'zod/v4'

import { MAX_MANGA_ID } from '@/constants/policy'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { db } from '@/database/supabase/drizzle'
import { readingHistoryTable } from '@/database/supabase/schema'
import { RouteProps } from '@/types/nextjs'
import { validateUserIdFromCookie } from '@/utils/cookie'
import { sec } from '@/utils/date'

const GETMangaIdReadingHistorySchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
})

type Params = {
  id: string
}

export async function GET(request: Request, { params }: RouteProps<Params>) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const validation = GETMangaIdReadingHistorySchema.safeParse(await params)

  if (!validation.success) {
    return new Response('Bad Request', { status: 400 })
  }

  const { id: mangaId } = validation.data

  try {
    const [history] = await db
      .select({ lastPage: readingHistoryTable.lastPage })
      .from(readingHistoryTable)
      .where(and(eq(readingHistoryTable.userId, userId), eq(readingHistoryTable.mangaId, mangaId)))

    const cacheControl = createCacheControl({
      private: true,
      maxAge: sec('10 seconds'),
    })

    if (!history) {
      return new Response(null, { status: 204, headers: { 'Cache-Control': cacheControl } })
    }

    return Response.json(history.lastPage, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
