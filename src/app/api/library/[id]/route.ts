import { and, desc, eq, lt, or } from 'drizzle-orm'
import { z } from 'zod/v4'

import { decodeLibraryIdCursor, encodeLibraryIdCursor } from '@/common/cursor'
import { LIBRARY_ITEMS_PER_PAGE } from '@/constants/policy'
import { db } from '@/database/drizzle'
import { libraryItemTable, libraryTable } from '@/database/schema'
import { RouteProps } from '@/types/nextjs'
import { getUserIdFromCookie } from '@/utils/session'

const GETLibraryIdSchema = z.object({
  id: z.coerce.number().int().positive(),
  cursor: z.string().nullable(),
})

export type GETLibraryItemsResponse = {
  items: { mangaId: number; createdAt: number }[]
  nextCursor: string | null
}

type Params = {
  id: string
}

export async function GET(request: Request, { params }: RouteProps<Params>) {
  const { id } = await params
  const { searchParams } = new URL(request.url)

  const validation = GETLibraryIdSchema.safeParse({
    id,
    cursor: searchParams.get('cursor'),
  })

  if (!validation.success) {
    return new Response('Bad Request', { status: 400 })
  }

  const { id: libraryId, cursor } = validation.data

  try {
    const userId = await getUserIdFromCookie()

    const [library] = await db
      .select({
        id: libraryTable.id,
        userId: libraryTable.userId,
        isPublic: libraryTable.isPublic,
      })
      .from(libraryTable)
      .where(
        and(
          eq(libraryTable.id, libraryId),
          or(eq(libraryTable.userId, Number(userId)), eq(libraryTable.isPublic, true)),
        ),
      )

    if (!library) {
      return new Response('Not Found', { status: 404 })
    }

    let query = db
      .select({ mangaId: libraryItemTable.mangaId, createdAt: libraryItemTable.createdAt })
      .from(libraryItemTable)
      .orderBy(desc(libraryItemTable.createdAt), desc(libraryItemTable.mangaId))
      .limit(LIBRARY_ITEMS_PER_PAGE + 1)
      .$dynamic()

    if (cursor) {
      const cursorData = decodeLibraryIdCursor(cursor)

      if (!cursorData) {
        return new Response('Bad Request', { status: 400 })
      }

      const { timestamp: cursorTimestamp, mangaId: cursorMangaId } = cursorData

      query = query.where(
        and(
          eq(libraryItemTable.libraryId, libraryId),
          or(
            lt(libraryItemTable.createdAt, new Date(cursorTimestamp)),
            and(eq(libraryItemTable.createdAt, new Date(cursorTimestamp)), lt(libraryItemTable.mangaId, cursorMangaId)),
          ),
        ),
      )
    } else {
      query = query.where(eq(libraryItemTable.libraryId, libraryId))
    }

    const itemRows = await query
    const hasNext = itemRows.length > LIBRARY_ITEMS_PER_PAGE

    if (hasNext) {
      itemRows.pop()
    }

    const items = itemRows.map((item) => ({
      mangaId: item.mangaId,
      createdAt: item.createdAt.getTime(),
    }))

    const nextCursor = hasNext
      ? encodeLibraryIdCursor(items[items.length - 1].createdAt, items[items.length - 1].mangaId)
      : null

    return Response.json({ items, nextCursor } satisfies GETLibraryItemsResponse)
  } catch (error) {
    console.error('Failed to fetch library items:', error)
    return Response.json('Internal Server Error', { status: 500 })
  }
}
