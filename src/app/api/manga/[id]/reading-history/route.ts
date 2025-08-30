import { and, eq } from 'drizzle-orm'
import { z } from 'zod/v4'

import { MAX_MANGA_ID } from '@/constants/policy'
import { handleRouteError } from '@/crawler/proxy-utils'
import { db } from '@/database/drizzle'
import { readingHistoryTable } from '@/database/schema'
import { RouteProps } from '@/types/nextjs'
import { getUserIdFromCookie } from '@/utils/session'

const GETMangaIdReadingHistorySchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
})

type Params = {
  id: string
}

export async function GET(request: Request, { params }: RouteProps<Params>) {
  const userId = await getUserIdFromCookie()

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
      .where(and(eq(readingHistoryTable.userId, Number(userId)), eq(readingHistoryTable.mangaId, mangaId)))

    if (!history) {
      return new Response(null, { status: 200 })
    }

    return Response.json(history.lastPage, { status: 200 })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
