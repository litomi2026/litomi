import { eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { createCacheControl } from '@/crawler/proxy-utils'
import { db } from '@/database/supabase/drizzle'
import { libraryItemTable, libraryTable } from '@/database/supabase/library'
import { intToHexColor } from '@/utils/color'

export type GETLibraryResponse = {
  id: number
  color: string | null
  icon: string | null
  name: string
  itemCount: number
}[]

const getLibraryRoute = new Hono<Env>()

getLibraryRoute.get('/', async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return problemResponse(c, { status: 401 })
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
        itemCount: sql<number>`(SELECT COUNT(*) FROM ${libraryItemTable} WHERE ${libraryItemTable.libraryId} = ${libraryTable.id})`,
      })
      .from(libraryTable)
      .where(eq(libraryTable.userId, userId))
      .orderBy(libraryTable.id)

    const librariesWithHexColors = libraries.map((lib) => ({ ...lib, color: intToHexColor(lib.color) }))

    const cacheControl = createCacheControl({
      private: true,
      maxAge: 3,
    })

    return c.json<GETLibraryResponse>(librariesWithHexColors, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '서재를 불러오지 못했어요' })
  }
})

export default getLibraryRoute
