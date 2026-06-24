'use client'

import type { ReactNode } from 'react'

import { useMemo } from 'react'

import { usePathname } from '@/i18n/navigation'
import useMeQuery from '@/query/useMeQuery'
import { isAdultVerified } from '@/utils/adult-verification'

import useLocalReadingHistorySummaryQuery from './history/useLocalReadingHistorySummaryQuery'
import LibraryHeader from './LibraryHeader'
import LibrarySidebar from './LibrarySidebar'
import { LibrarySelectionProvider } from './librarySelection'
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

export default function LibraryLayout({ children }: Props) {
  const pathname = usePathname()
  const { data: me } = useMeQuery()
  const userId = me?.id
  const canUseServerHistory = isAdultVerified(me)
  const { data: serverSummary } = useLibrarySummaryQuery({ userId })
  const { data: localHistorySummary } = useLocalReadingHistorySummaryQuery({ enabled: !canUseServerHistory })

  const summary = {
    ...serverSummary,
    historyCount: canUseServerHistory ? serverSummary?.historyCount : localHistorySummary?.historyCount,
  }

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    isPending: isLibrariesPending,
  } = useLibraryListInfiniteQuery({
    enabled: me !== undefined,
    userId,
  })

  const {
    data: pinnedData,
    fetchNextPage: fetchNextPinnedPage,
    hasNextPage: hasNextPinnedPage,
    isFetchingNextPage: isFetchingNextPinnedPage,
    isPending: isPinnedLibrariesPending,
  } = usePinnedLibraryListInfiniteQuery({
    enabled: me !== undefined && Boolean(userId),
    userId,
  })

  const libraries = useMemo(() => mergeUniqueLibraries(data?.pages), [data?.pages])
  const pinnedLibraries = useMemo(() => mergeUniqueLibraries(pinnedData?.pages), [pinnedData?.pages])

  const sidebarPagination = {
    hasNextPage: hasNextPage || hasNextPinnedPage,
    isFetchingNextPage: isFetchingNextPage || isFetchingNextPinnedPage,
    isFetchNextPageError,
    isPending: me === undefined || isLibrariesPending || isPinnedLibrariesPending,
    onRetryNextPage: () => {
      if (hasNextPage) {
        fetchNextPage()
      }
      if (hasNextPinnedPage) {
        fetchNextPinnedPage()
      }
    },
  }

  return (
    <>
      <LibrarySidebar
        className="fixed top-0 bottom-0 z-20 pt-safe hidden flex-col bg-background overflow-y-auto scrollbar-hidden sm:flex lg:w-52"
        libraries={libraries}
        pagination={sidebarPagination}
        pinnedLibraries={pinnedLibraries}
        summary={summary}
        userId={userId}
      />
      <div className="hidden sm:block sm:w-[67px] lg:w-52" />
      <div className="flex min-h-0 flex-col flex-1 [--library-header-height:4rem] sm:[--library-header-height:4.5rem]">
        <LibrarySelectionProvider scopeKey={pathname}>
          <LibraryHeader
            historySource={canUseServerHistory ? 'server' : 'local'}
            libraries={libraries}
            pinnedLibraries={pinnedLibraries}
            sidebarPagination={sidebarPagination}
            summary={summary}
            userId={userId}
          />
          {children}
        </LibrarySelectionProvider>
      </div>
    </>
  )
}

function mergeUniqueLibraries(pages?: { libraries: LibraryListItem[] }[]) {
  const seen = new Set<number>()
  const libraries: LibraryListItem[] = []

  for (const page of pages ?? []) {
    for (const library of page.libraries) {
      if (seen.has(library.id)) {
        continue
      }

      seen.add(library.id)
      libraries.push(library)
    }
  }

  return libraries
}
