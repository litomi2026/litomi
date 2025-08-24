'use client'

import { useMemo } from 'react'

import useBookmarkIdsInfiniteQuery from '@/app/(navigation)/(right-search)/[name]/bookmark/useBookmarkIdsInfiniteQuery'
import { Bookmark } from '@/app/api/bookmark/route'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'

interface Props {
  initialBookmarks: Bookmark[]
}

export default function BookmarkList({ initialBookmarks }: Readonly<Props>) {
  const {
    data: bookmarksData,
    fetchNextPage: fetchMoreBookmarks,
    hasNextPage: hasMoreBookmarksToLoad,
    isFetchingNextPage: isLoadingMoreBookmarks,
  } = useBookmarkIdsInfiniteQuery(initialBookmarks)

  const bookmarkPages = bookmarksData?.pages
  const bookmarkIds = useMemo(() => bookmarkPages?.flatMap((page) => page.bookmarks) ?? [], [bookmarkPages])

  const infiniteScrollTriggerRef = useInfiniteScrollObserver({
    hasNextPage: hasMoreBookmarksToLoad,
    isFetchingNextPage: isLoadingMoreBookmarks,
    fetchNextPage: fetchMoreBookmarks,
  })

  const { mangaMap } = useMangaListCachedQuery({ mangaIds: bookmarkIds.map((item) => item.mangaId) })

  if (bookmarkIds.length === 0 && !isLoadingMoreBookmarks) {
    return <EmptyBookmarks />
  }

  return (
    <>
      <ul className="grid gap-2 md:grid-cols-2 grow">
        {bookmarkIds.map(({ mangaId }, index) => {
          const manga = mangaMap.get(mangaId)

          if (!manga) {
            return <MangaCardSkeleton key={mangaId} />
          }

          return <MangaCard index={index} key={mangaId} manga={manga} />
        })}
        {isLoadingMoreBookmarks && <MangaCardSkeleton />}
      </ul>

      <div className="w-full p-2" ref={infiniteScrollTriggerRef} />
    </>
  )
}

function EmptyBookmarks() {
  return (
    <div className="flex flex-col grow justify-center items-center">
      <p className="text-zinc-500">북마크가 없습니다.</p>
    </div>
  )
}
