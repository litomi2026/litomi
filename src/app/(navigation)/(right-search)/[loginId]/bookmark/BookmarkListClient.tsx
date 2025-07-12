'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useInView } from 'react-intersection-observer'

import useBookmarkIdsInfiniteQuery from '@/app/(navigation)/(right-search)/[loginId]/bookmark/useBookmarkIdsInfiniteQuery'
import { BookmarkWithSource } from '@/app/api/bookmarks/route'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import { mapBookmarkSourceToSourceParam } from '@/utils/param'

import useMangaInfiniteQuery from './useMangaInfiniteQuery'

interface BookmarkListClientProps {
  initialBookmarks: BookmarkWithSource[]
}

export default function BookmarkListClient({ initialBookmarks }: BookmarkListClientProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useBookmarkIdsInfiniteQuery(initialBookmarks)
  const bookmarkIds = useMemo(() => data.pages.flatMap((page) => page.bookmarks), [data.pages])

  const {
    data: mangaData,
    fetchNextPage: fetchNextManga,
    hasNextPage: hasMangaNextPage,
    isFetchingNextPage: isFetchingMangaNextPage,
  } = useMangaInfiniteQuery(bookmarkIds)

  const { inView, ref } = useInView({
    rootMargin: '100px',
    threshold: 0.1,
  })

  const loadMoreRef = useInfiniteScrollObserver({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  })

  const fetchInitiatedRef = useRef(false)

  useEffect(() => {
    if (inView && hasMangaNextPage && !isFetchingMangaNextPage) {
      if (!fetchInitiatedRef.current) {
        fetchInitiatedRef.current = true
        fetchNextManga()
      }
    } else if (!inView) {
      fetchInitiatedRef.current = false
    }
  }, [inView, hasMangaNextPage, isFetchingMangaNextPage, fetchNextManga])

  if (bookmarkIds.length === 0 && !isFetchingNextPage) {
    return (
      <div className="flex flex-col grow justify-center items-center">
        <p className="text-zinc-500">북마크가 없습니다.</p>
      </div>
    )
  }

  let hasAddedRefToSkeleton = false

  return (
    <>
      <ul className="grid gap-2 md:grid-cols-2 grow">
        {bookmarkIds.map((bookmark, index) => {
          const key = `${bookmark.source}:${bookmark.mangaId}`
          const mangaInfo = mangaData.get(key)

          if (mangaInfo?.manga) {
            return (
              <MangaCard
                index={index}
                key={key}
                manga={mangaInfo.manga}
                source={mapBookmarkSourceToSourceParam(mangaInfo.source)}
              />
            )
          } else {
            const shouldAddRef = !hasAddedRefToSkeleton
            if (shouldAddRef) hasAddedRefToSkeleton = true

            return (
              <div key={key} ref={shouldAddRef ? ref : undefined}>
                <MangaCardSkeleton />
              </div>
            )
          }
        })}
        {isFetchingNextPage && <MangaCardSkeleton />}
      </ul>
      <div className="w-full py-4 flex justify-center" ref={loadMoreRef} />
    </>
  )
}
