import { eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

import { Env } from '@/backend'
import { getUserId } from '@/backend/utils/auth'
import { db } from '@/database/supabase/drizzle'
import { libraryItemTable, libraryTable } from '@/database/supabase/schema'
import { intToHexColor } from '@/utils/color'

import itemsRoutes from './[id]'

export type GETLibraryResponse = {
  id: number
  color: string | null
  icon: string | null
  name: string
  itemCount: number
}[]

const libraryRoutes = new Hono<Env>()

libraryRoutes.get('/', async (c) => {
  const userId = getUserId()

  if (!userId) {
    throw new HTTPException(401)
  }

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

  return c.json<GETLibraryResponse>(librariesWithHexColors)
})

libraryRoutes.route('/:id', itemsRoutes)

export default libraryRoutes
