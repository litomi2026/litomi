import { and, desc, eq, sql } from 'drizzle-orm'

import { db } from '@/database/supabase/drizzle'
import { libraryItemTable, libraryTable } from '@/database/supabase/schema'

import PublicLibrariesSection from './PublicLibrariesSection'

type Props = {
  mangaId: number
}
export default async function PublicLibraries({ mangaId }: Props) {
  const libraries = await db
    .select({
      id: libraryTable.id,
      name: libraryTable.name,
      description: libraryTable.description,
      color: libraryTable.color,
      icon: libraryTable.icon,
      itemCount: sql<number>`(SELECT COUNT(*) FROM ${libraryItemTable} WHERE ${libraryItemTable.libraryId} = ${libraryTable.id})::int`,
    })
    .from(libraryItemTable)
    .innerJoin(libraryTable, eq(libraryItemTable.libraryId, libraryTable.id))
    .where(and(eq(libraryItemTable.mangaId, mangaId), eq(libraryTable.isPublic, true)))
    .orderBy(({ itemCount }) => [desc(itemCount), desc(libraryTable.createdAt)])
    .limit(10)

  if (libraries.length === 0) {
    return null
  }

  return <PublicLibrariesSection libraries={libraries} />
}
