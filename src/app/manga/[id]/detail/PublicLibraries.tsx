import { and, desc, eq, sql } from 'drizzle-orm'
import { unstable_cache } from 'next/cache'

import { db } from '@/database/supabase/drizzle'
import { libraryItemTable, libraryTable } from '@/database/supabase/schema'
import { sec } from '@/utils/date'

import PublicLibrariesSection from './PublicLibrariesSection'

type Props = {
  mangaId: number
}
export default async function PublicLibraries({ mangaId }: Props) {
  const libraries = await getPublicLibraries(mangaId)

  if (libraries.length === 0) {
    return null
  }

  return <PublicLibrariesSection libraries={libraries} />
}

const getPublicLibraries = unstable_cache(
  async (mangaId: number) =>
    db
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
      .limit(10),
  ['public-libraries'],
  { tags: ['public-libraries'], revalidate: sec('1 day') },
)
