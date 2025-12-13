import { and, desc, eq, sql } from 'drizzle-orm'
import { Library } from 'lucide-react'
import { unstable_cache } from 'next/cache'
import Link from 'next/link'

import { db } from '@/database/supabase/drizzle'
import { libraryItemTable, libraryTable } from '@/database/supabase/schema'
import { intToHexColor } from '@/utils/color'
import { sec } from '@/utils/date'

type Props = {
  mangaId: number
}
export default async function PublicLibrarySection({ mangaId }: Props) {
  const libraries = await getPublicLibraries(mangaId)

  if (libraries.length === 0) {
    return null
  }

  return (
    <div className="border-b-2 p-4">
      <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
        <Library className="size-4" />이 작품이 포함된 공개 서재
      </h3>
      <ul className="flex gap-2 overflow-x-auto scrollbar-hidden snap-x snap-mandatory">
        {libraries.map((library) => (
          <li className="shrink-0 w-48 snap-start" key={library.id}>
            <Link
              className="flex flex-col gap-1 h-full p-3 bg-zinc-900 rounded-lg transition border-2 border-transparent hover:border-zinc-600"
              href={`/library/${library.id}`}
              prefetch={false}
            >
              <div className="flex items-center gap-2">
                {library.icon && (
                  <div
                    className="size-6 rounded flex items-center justify-center shrink-0"
                    style={{ background: intToHexColor(library.color) || '#3f3f46' }}
                  >
                    <span className="text-sm">{library.icon}</span>
                  </div>
                )}
                <h4 className="text-sm font-medium text-zinc-200 line-clamp-1 break-all">{library.name}</h4>
                <p className="text-xs text-zinc-500 shrink-0">{library.itemCount}개</p>
              </div>
              <p className="text-xs text-zinc-500 line-clamp-1 break-all">{library.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
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
