'use client'

import { useMemo } from 'react'
import { useInView } from 'react-intersection-observer'

import useBookmarkIdsInfiniteQuery from '@/app/(navigation)/(right-search)/[loginId]/bookmark/useBookmarkIdsInfiniteQuery'
import { BookmarkWithSource } from '@/app/api/bookmarks/route'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import { mapBookmarkSourceToSourceParam } from '@/utils/param'

import useMangaInfiniteQuery, { MangaDetails } from './useMangaInfiniteQuery'

interface BookmarkListItemProps {
  index: number
  mangaDetails: MangaDetails | undefined
  onInView?: () => void
}

interface Props {
  initialBookmarks: BookmarkWithSource[]
}

export default function BookmarkListClient({ initialBookmarks }: Props) {
  const {
    data: bookmarksData,
    fetchNextPage: fetchMoreBookmarks,
    hasNextPage: hasMoreBookmarksToLoad,
    isFetchingNextPage: isLoadingMoreBookmarks,
  } = useBookmarkIdsInfiniteQuery(initialBookmarks)

  const bookmarkIds = useMemo(() => bookmarksData.pages.flatMap((page) => page.bookmarks), [bookmarksData.pages])

  const {
    data: mangaDetailsMap,
    fetchNextPage: fetchMoreMangaDetails,
    isFetchingNextPage: isLoadingMoreManga,
  } = useMangaInfiniteQuery(bookmarkIds)

  const infiniteScrollTriggerRef = useInfiniteScrollObserver({
    hasNextPage: hasMoreBookmarksToLoad,
    isFetchingNextPage: isLoadingMoreBookmarks,
    fetchNextPage: fetchMoreBookmarks,
  })

  const onMangaVisible = () => {
    if (!isLoadingMoreManga) {
      fetchMoreMangaDetails()
    }
  }

  if (bookmarkIds.length === 0 && !isLoadingMoreBookmarks) {
    return <EmptyBookmarks />
  }

  const firstUnfetchedMangaIndex = bookmarkIds.findIndex((bookmark) => {
    const key = generateBookmarkKey(bookmark)
    return !mangaDetailsMap.has(key)
  })

  return (
    <>
      <ul className="grid gap-2 md:grid-cols-2 grow">
        {bookmarkIds.map((bookmark, index) => {
          const key = generateBookmarkKey(bookmark)
          const shouldFetchMangaDetails = index === firstUnfetchedMangaIndex

          return (
            <BookmarkListItem
              index={index}
              key={key}
              mangaDetails={mangaDetailsMap.get(key)}
              onInView={shouldFetchMangaDetails ? onMangaVisible : undefined}
            />
          )
        })}

        {isLoadingMoreBookmarks && <MangaCardSkeleton />}
      </ul>

      <div className="w-full py-4 flex justify-center" ref={infiniteScrollTriggerRef} />
    </>
  )
}

function BookmarkListItem({ mangaDetails, index, onInView }: BookmarkListItemProps) {
  const { ref } = useInView({
    rootMargin: '100px',
    threshold: 0.1,
    onChange: (inView) => inView && onInView?.(),
  })

  if (mangaDetails?.manga) {
    return (
      <MangaCard
        index={index}
        manga={mangaDetails.manga}
        source={mapBookmarkSourceToSourceParam(mangaDetails.source)}
      />
    )
  }

  return (
    <div ref={ref}>
      <MangaCardSkeleton />
    </div>
  )
}

function EmptyBookmarks() {
  return (
    <div className="flex flex-col grow justify-center items-center">
      <p className="text-zinc-500">북마크가 없습니다.</p>
    </div>
  )
}

function generateBookmarkKey(bookmark: BookmarkWithSource): string {
  return `${bookmark.source}:${bookmark.mangaId}`
}
