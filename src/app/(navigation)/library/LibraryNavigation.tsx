'use client'

import type { ReactNode } from 'react'

import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

import useMeQuery from '@/query/useMeQuery'

import LibraryHeader from './LibraryHeader'
import { LibrarySelectionProvider } from './librarySelection'
import LibrarySidebar from './LibrarySidebar'
import useLibraryListInfiniteQuery from './useLibraryListInfiniteQuery'
import useLibrarySummaryQuery from './useLibrarySummaryQuery'
import usePinnedLibraryListInfiniteQuery from './usePinnedLibraryListInfiniteQuery'

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
  const pathname = usePathname()
  const { data: me, isPending: isMePending } = useMeQuery()
  const userId = me?.id
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

  const {
    data: pinnedData,
    fetchNextPage: fetchNextPinnedPage,
    hasNextPage: hasNextPinnedPage,
    isFetchingNextPage: isFetchingNextPinnedPage,
    isPending: isPinnedLibrariesPending,
  } = usePinnedLibraryListInfiniteQuery({
    enabled: !isMePending && !!userId,
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

  const pinnedLibraries = useMemo(() => {
    const map = new Map<number, LibraryListItem>()
    pinnedData?.pages.forEach((page) => {
      page.libraries.forEach((lib) => {
        if (!map.has(lib.id)) {
          map.set(lib.id, lib)
        }
      })
    })
    return Array.from(map.values())
  }, [pinnedData])

  const sidebarPagination = {
    hasNextPage: hasNextPage || hasNextPinnedPage,
    isFetchingNextPage: isFetchingNextPage || isFetchingNextPinnedPage,
    isFetchNextPageError,
    isPending: isMePending || isLibrariesPending || isPinnedLibrariesPending,
    onRetryNextPage: () => {
      if (hasNextPage) fetchNextPage()
      if (hasNextPinnedPage) fetchNextPinnedPage()
    },
  }

  return (
    <div className="flex-1 flex flex-col sm:flex-row">
      <LibrarySidebar
        bookmarkCount={summary?.bookmarkCount}
        className="fixed top-0 bottom-0 z-20 hidden flex-col bg-background overflow-y-auto scrollbar-hidden sm:flex lg:w-52"
        historyCount={summary?.historyCount}
        libraries={libraries}
        pagination={sidebarPagination}
        pinnedLibraries={pinnedLibraries}
        ratingCount={summary?.ratingCount}
        userId={userId}
      />
      <div className="hidden sm:block sm:w-[67px] lg:w-52" />
      <div className="flex flex-col flex-1">
        <LibrarySelectionProvider scopeKey={pathname}>
          <LibraryHeader
            bookmarkCount={summary?.bookmarkCount}
            historyCount={summary?.historyCount}
            libraries={libraries}
            pinnedLibraries={pinnedLibraries}
            ratingCount={summary?.ratingCount}
            sidebarPagination={sidebarPagination}
            userId={userId}
          />
          {children}
        </LibrarySelectionProvider>
      </div>
    </div>
  )
}
