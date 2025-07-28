'use client'

import { useMemo } from 'react'
import { useInView } from 'react-intersection-observer'

import useBookmarkIdsInfiniteQuery from '@/app/(navigation)/(right-search)/[name]/bookmark/useBookmarkIdsInfiniteQuery'
import { BookmarkWithSource } from '@/app/api/bookmarks/route'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import { mapBookmarkSourceToSourceParam } from '@/utils/param'

import useMangaInfiniteQuery, { MangaDetails } from './useMangaInfiniteQuery'
import { generateBookmarkKey } from './utils'

interface BookmarkItemProps {
  index: number
  mangaDetails: MangaDetails | undefined
  onInView?: () => void
}

interface Props {
  initialBookmarks: BookmarkWithSource[]
}

export default function BookmarkList({ initialBookmarks }: Readonly<Props>) {
  const {
    data: bookmarksData,
    fetchNextPage: fetchMoreBookmarks,
    hasNextPage: hasMoreBookmarksToLoad,
    isFetchingNextPage: isLoadingMoreBookmarks,
  } = useBookmarkIdsInfiniteQuery(initialBookmarks)

  const bookmarkIds = useMemo(() => bookmarksData.pages.flatMap((page) => page.bookmarks), [bookmarksData.pages])

  const infiniteScrollTriggerRef = useInfiniteScrollObserver({
    hasNextPage: hasMoreBookmarksToLoad,
    isFetchingNextPage: isLoadingMoreBookmarks,
    fetchNextPage: fetchMoreBookmarks,
  })

  const {
    data: mangaDetails,
    fetchNextPage: fetchMoreMangaDetails,
    isFetchingNextPage: isLoadingMoreManga,
  } = useMangaInfiniteQuery(bookmarkIds)

  const mangaDetailsMap = useMemo(() => {
    const map = new Map<string, MangaDetails>()

    if (!mangaDetails?.pages) {
      return map
    }

    mangaDetails.pages.forEach((page) => {
      page.forEach((item) => {
        map.set(generateBookmarkKey(item), item)
      })
    })

    return map
  }, [mangaDetails])

  const onMangaVisible = () => {
    if (!isLoadingMoreManga) {
      fetchMoreMangaDetails()
    }
  }

  const firstUnfetchedMangaIndex = useMemo(() => {
    return bookmarkIds.findIndex((bookmark) => !mangaDetailsMap.has(generateBookmarkKey(bookmark)))
  }, [bookmarkIds, mangaDetailsMap])

  if (bookmarkIds.length === 0 && !isLoadingMoreBookmarks) {
    return <EmptyBookmarks />
  }

  return (
    <>
      <ul className="grid gap-2 md:grid-cols-2 grow">
        {bookmarkIds.map((bookmark, index) => {
          const key = generateBookmarkKey(bookmark)
          const shouldFetchMangaDetails = index === firstUnfetchedMangaIndex

          return (
            <BookmarkItem
              index={index}
              key={key}
              mangaDetails={mangaDetailsMap.get(key)}
              onInView={shouldFetchMangaDetails ? onMangaVisible : undefined}
            />
          )
        })}
        {isLoadingMoreBookmarks && <MangaCardSkeleton />}
      </ul>

      <div className="w-full p-2" ref={infiniteScrollTriggerRef} />
    </>
  )
}

function BookmarkItem({ mangaDetails, index, onInView }: Readonly<BookmarkItemProps>) {
  const { ref } = useInView({
    rootMargin: '100px',
    threshold: 0.1,
    onChange: (inView) => inView && onInView?.(),
  })

  if (!mangaDetails?.manga) {
    return (
      <div ref={ref}>
        <MangaCardSkeleton />
      </div>
    )
  }

  return (
    <MangaCard index={index} manga={mangaDetails.manga} source={mapBookmarkSourceToSourceParam(mangaDetails.source)} />
  )
}

function EmptyBookmarks() {
  return (
    <div className="flex flex-col grow justify-center items-center">
      <p className="text-zinc-500">북마크가 없습니다.</p>
    </div>
  )
}
