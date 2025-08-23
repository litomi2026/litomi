import { eq, sql } from 'drizzle-orm'

import { handleRouteError } from '@/crawler/proxy-utils'
import { db } from '@/database/drizzle'
import { libraryItemTable, libraryTable } from '@/database/schema'
import { intToHexColor } from '@/utils/color'
import { getUserIdFromCookie } from '@/utils/session'

export type GETLibraryResponse = {
  id: number
  color: string | null
  icon: string | null
  name: string
  itemCount: number
}[]

export async function GET(request: Request) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const libraries = await db
      .select({
        id: libraryTable.id,
        userId: libraryTable.userId,
        name: libraryTable.name,
        description: libraryTable.description,
        color: libraryTable.color,
        icon: libraryTable.icon,
        isPublic: libraryTable.isPublic,
        createdAt: libraryTable.createdAt,
        itemCount: sql<number>`(SELECT COUNT(*) FROM ${libraryItemTable} WHERE ${libraryItemTable.libraryId} = ${libraryTable.id})::int`,
      })
      .from(libraryTable)
      .where(eq(libraryTable.userId, Number(userId)))
      .orderBy(libraryTable.id)

    const librariesWithHexColors = libraries.map((lib) => ({ ...lib, color: intToHexColor(lib.color) }))
    return Response.json(librariesWithHexColors satisfies GETLibraryResponse)
  } catch (error) {
    return handleRouteError(error, request)
  }
}
