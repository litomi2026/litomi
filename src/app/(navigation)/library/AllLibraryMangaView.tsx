'use client'

import { Library } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import useMeQuery from '@/query/useMeQuery'
import { View } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

import CensoredManga from './CensoredManga'
import CreateLibraryButton from './CreateLibraryButton'
import useAllLibraryMangaInfiniteQuery from './useAllLibraryMangaInfiniteQuery'

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

export default function AllLibraryMangaView() {
  const { data: me, isPending: isMePending } = useMeQuery()
  const userId = me?.id ?? null

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    isPending: isMangaPending,
  } = useAllLibraryMangaInfiniteQuery({
    enabled: !isMePending,
    userId,
  })

  const items = useMemo(() => {
    const map = new Map<number, LibraryItem>()

    data?.pages.forEach((page) => {
      page.items.forEach((item) => {
        if (!map.has(item.mangaId)) {
          map.set(item.mangaId, item)
        }
      })
    })

    return Array.from(map.values())
  }, [data])

  const infiniteScrollTriggerRef = useInfiniteScrollObserver({
    hasNextPage: hasNextPage && !isFetchNextPageError,
    isFetchingNextPage,
    fetchNextPage,
  })

  const { mangaMap } = useMangaListCachedQuery({ mangaIds: items.map((item) => item.mangaId) })
  const isInitialLoading = items.length === 0 && (isMePending || isMangaPending)

  if (isInitialLoading) {
    return (
      <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[View.CARD]} gap-2 p-2`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <MangaCardSkeleton key={i} />
        ))}
      </ul>
    )
  }

  if (items.length === 0) {
    if (userId) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <h1 className="sr-only">모든 서재</h1>
          <Library className="size-24 sm:size-32 mx-auto mb-4 sm:mb-6 text-zinc-700" />
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">아직 서재가 없어요</h2>
          <p className="text-sm sm:text-base text-zinc-500 mb-6 sm:mb-8">
            서재를 만들어 작품을 체계적으로 관리해보세요
          </p>
          <CreateLibraryButton className="justify-center" />
        </div>
      )
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <h1 className="sr-only">모든 서재</h1>
        <Library className="size-24 sm:size-32 mx-auto mb-4 sm:mb-6 text-zinc-700" />
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">공개된 서재가 없어요</h2>
        <p className="text-sm sm:text-base text-zinc-500 mb-6 sm:mb-8">다른 사용자들이 공개한 서재가 아직 없어요</p>
      </div>
    )
  }

  return (
    <>
      <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[View.CARD]} gap-2 p-2`}>
        {items.map(({ library, mangaId }, index) => {
          const manga = mangaMap.get(mangaId) ?? { id: mangaId, title: '불러오는 중', images: [] }

          return (
            <div className="relative rounded-xl overflow-hidden" key={mangaId}>
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
        {isFetchingNextPage && <MangaCardSkeleton />}
      </ul>
      {hasNextPage && <div className="w-full p-2" ref={infiniteScrollTriggerRef} />}
      {isFetchNextPageError && (
        <div className="flex justify-center p-2">
          <button
            className="text-xs text-zinc-400 hover:text-foreground px-3 py-2 rounded-md hover:bg-zinc-800 transition"
            onClick={() => {
              void fetchNextPage()
            }}
            type="button"
          >
            다시 시도해요
          </button>
        </div>
      )}
    </>
  )
}
