'use client'

import { useMemo } from 'react'
import { useInView } from 'react-intersection-observer'

import useBookmarkIdsInfiniteQuery from '@/app/(navigation)/(right-search)/[name]/bookmark/useBookmarkIdsInfiniteQuery'
import { Bookmark } from '@/app/api/bookmark/route'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import { Manga } from '@/types/manga'

import useMangaInfiniteQuery from './useMangaInfiniteQuery'

interface BookmarkItemProps {
  index: number
  manga?: Manga
  onInView?: () => void
}

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

  const {
    data: mangaDetails,
    fetchNextPage: fetchMoreMangaDetails,
    isFetchingNextPage: isLoadingMoreManga,
  } = useMangaInfiniteQuery(bookmarkIds)

  const mangaDetailsMap = useMemo(() => {
    const map = new Map<number, Manga>()

    if (!mangaDetails?.pages) {
      return map
    }

    mangaDetails.pages.forEach((page) => {
      page.forEach((item) => {
        map.set(item.id, item)
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
    return bookmarkIds.findIndex((bookmark) => !mangaDetailsMap.has(bookmark.mangaId))
  }, [bookmarkIds, mangaDetailsMap])

  if (bookmarkIds.length === 0 && !isLoadingMoreBookmarks) {
    return <EmptyBookmarks />
  }

  return (
    <>
      <ul className="grid gap-2 md:grid-cols-2 grow">
        {bookmarkIds.map((bookmark, index) => {
          const key = bookmark.mangaId
          const shouldFetchMangaDetails = index === firstUnfetchedMangaIndex

          return (
            <BookmarkItem
              index={index}
              key={key}
              manga={mangaDetailsMap.get(key)}
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

function BookmarkItem({ manga, index, onInView }: Readonly<BookmarkItemProps>) {
  const { ref } = useInView({
    rootMargin: '100px',
    threshold: 0.1,
    onChange: (inView) => inView && onInView?.(),
  })

  if (!manga) {
    return (
      <div ref={ref}>
        <MangaCardSkeleton />
      </div>
    )
  }

  return <MangaCard index={index} manga={manga} />
}

function EmptyBookmarks() {
  return (
    <div className="flex flex-col grow justify-center items-center">
      <p className="text-zinc-500">북마크가 없습니다.</p>
    </div>
  )
}
