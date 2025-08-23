import { and, desc, eq, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/database/drizzle'
import { libraryItemTable, libraryTable } from '@/database/schema'
import { RouteProps } from '@/types/nextjs'
import { getUserIdFromCookie } from '@/utils/session'

const GETLibraryIdSchema = z.object({
  id: z.coerce.number().int().positive(),
  cursor: z.coerce.number().int().positive().optional(),
})

const limit = 10

export type GETLibraryItemsResponse = {
  items: { mangaId: number; createdAt: number }[]
  nextCursor: number | null
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
      .limit(limit + 1)
      .$dynamic()

    if (cursor) {
      query = query.where(
        and(
          eq(libraryItemTable.libraryId, Number(libraryId)),
          sql`${libraryItemTable.createdAt} < ${new Date(cursor)}`,
        ),
      )
    } else {
      query = query.where(eq(libraryItemTable.libraryId, Number(libraryId)))
    }

    const itemRows = await query
    const hasNext = itemRows.length > limit

    if (hasNext) {
      itemRows.pop()
    }

    const items = itemRows.map((item) => ({
      mangaId: item.mangaId,
      createdAt: item.createdAt.getTime(),
    }))

    const nextCursor = hasNext ? items[items.length - 1].createdAt : null

    return Response.json({ items, nextCursor } satisfies GETLibraryItemsResponse)
  } catch (error) {
    console.error('Failed to fetch library items:', error)
    return Response.json('Internal Server Error', { status: 500 })
  }
}
