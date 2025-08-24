'use client'

import Link from 'next/link'

import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import { Manga } from '@/types/manga'
import { ViewCookie } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

type Library = {
  id: number
  name: string
  color: string | null
  icon: string | null
}

type LibraryItem = {
  mangaId: number
  createdAt: number
  library: Library
}

type Props = {
  initialItems: LibraryItem[]
}

export default function AllLibraryMangaView({ initialItems }: Props) {
  const { mangaMap } = useMangaListCachedQuery({ mangaIds: initialItems.map((item) => item.mangaId) })

  return (
    <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[ViewCookie.CARD]} gap-2 p-4`}>
      {initialItems.map((item, index) => {
        const manga = mangaMap.get(item.mangaId)

        if (!manga) {
          return <MangaCardSkeleton key={`skeleton-${item.library.id}-${item.mangaId}-${index}`} />
        }

        return (
          <MangaCardWithLibraryBadge
            index={index}
            key={`${item.library.name}-${item.mangaId}`}
            library={item.library}
            manga={manga}
          />
        )
      })}
    </ul>
  )
}

function MangaCardWithLibraryBadge({ manga, index, library }: { manga: Manga; index: number; library: Library }) {
  return (
    <div className="relative">
      <MangaCard className="h-full" index={index} manga={manga} />
      <Link
        className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-md 
          bg-zinc-900/90 border border-zinc-700 shadow-lg hover:bg-zinc-800 transition"
        href={`/library/${library.id}`}
        style={{ borderColor: library.color ?? '' }}
      >
        {library.icon && <span className="text-xs">{library.icon}</span>}
        <span className="text-xs font-medium truncate max-w-[100px]">{library.name}</span>
      </Link>
    </div>
  )
}
