'use client'

import Link from 'next/link'

import MangaCard from '@/components/card/MangaCard'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import { View } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

import CensoredManga from './CensoredManga'

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
    <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[View.CARD]} gap-2 p-2`}>
      {initialItems.map(({ library, mangaId }, index) => {
        const manga = mangaMap.get(mangaId) ?? { id: mangaId, title: '불러오는 중', images: [] }

        return (
          <div className="relative rounded-xl overflow-hidden" key={`${library.id}-${mangaId}`}>
            <CensoredManga mangaId={mangaId} />
            <MangaCard className="h-full" index={index} manga={manga} />
            <Link
              className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-900/90 border border-zinc-700 shadow-lg hover:bg-zinc-800 transition"
              href={`/library/${library.id}`}
              prefetch={false}
              style={{ borderColor: library.color ?? '' }}
            >
              {library.icon && <span className="text-xs">{library.icon}</span>}
              <span className="text-xs font-medium truncate max-w-[100px]">{library.name}</span>
            </Link>
          </div>
        )
      })}
    </ul>
  )
}
