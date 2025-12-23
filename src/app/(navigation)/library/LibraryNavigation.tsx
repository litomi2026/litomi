'use client'

import type { ReactNode } from 'react'

import { useMemo } from 'react'

import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import useMeQuery from '@/query/useMeQuery'

import LibraryHeader from './LibraryHeader'
import LibrarySidebar from './LibrarySidebar'
import useLibraryListInfiniteQuery from './useLibraryListInfiniteQuery'
import useLibrarySummaryQuery from './useLibrarySummaryQuery'

type LibraryListItem = {
  id: number
  userId: number
  name: string
  description: string | null
  color: string | null
  icon: string | null
  isPublic: boolean
  createdAt: number
  itemCount: number
}

type Props = {
  children: ReactNode
}

export default function LibraryNavigation({ children }: Readonly<Props>) {
  const { data: me, isPending: isMePending } = useMeQuery()
  const userId = me?.id ?? null
  const { data: summary } = useLibrarySummaryQuery({ userId })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    isPending: isLibrariesPending,
  } = useLibraryListInfiniteQuery({
    enabled: !isMePending,
    userId,
  })

  const libraries = useMemo(() => {
    const map = new Map<number, LibraryListItem>()
    data?.pages.forEach((page) => {
      page.libraries.forEach((lib) => {
        if (!map.has(lib.id)) {
          map.set(lib.id, lib)
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

  const sidebarPagination = {
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    infiniteScrollTriggerRef,
    isPending: isMePending || isLibrariesPending,
    onRetryNextPage: () => fetchNextPage(),
  }

  return (
    <div className="flex-1 flex flex-col sm:flex-row">
      <LibrarySidebar
        bookmarkCount={summary?.bookmarkCount}
        className="fixed top-0 bottom-0 z-20 hidden flex-col bg-background overflow-y-auto scrollbar-hidden sm:flex lg:w-52"
        historyCount={summary?.historyCount}
        libraries={libraries}
        pagination={sidebarPagination}
        ratingCount={summary?.ratingCount}
        userId={userId}
      />
      <div className="hidden sm:block sm:w-[67px] lg:w-52" />
      <div className="flex flex-col flex-1">
        <LibraryHeader
          bookmarkCount={summary?.bookmarkCount}
          historyCount={summary?.historyCount}
          libraries={libraries}
          ratingCount={summary?.ratingCount}
          sidebarPagination={sidebarPagination}
          userId={userId}
        />
        {children}
      </div>
    </div>
  )
}
