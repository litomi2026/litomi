'use client'

import { useMemo, useState } from 'react'

import type { GETLibraryItemsResponse } from '@/backend/api/v1/library/[id]/item/GET'

import {
  COLLECTION_ITEM_SORT_OPTIONS,
  CollectionItemSort,
  DEFAULT_COLLECTION_ITEM_SORT,
} from '@/backend/api/v1/library/item-sort'
import AdultVerificationGate from '@/components/AdultVerificationGate'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import LoadMoreRetryButton from '@/components/ui/LoadMoreRetryButton'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import useLibraryItemsInfiniteQuery from '@/query/useLibraryItemsInfiniteQuery'
import useMeQuery from '@/query/useMeQuery'
import { getAdultState, hasAdultAccess } from '@/utils/adult-verification'
import { View } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

import { useLibrarySelection } from '../librarySelection'
import SelectableMangaCard from '../SelectableMangaCard'

type Props = {
  library: {
    id: number
    name: string
    isPublic: boolean
  }
  initialItems: GETLibraryItemsResponse
  initialSort?: CollectionItemSort
  isOwner: boolean
}

export default function LibraryItemsClient({
  library,
  initialItems,
  initialSort = DEFAULT_COLLECTION_ITEM_SORT,
  isOwner,
}: Props) {
  const { id: libraryId, name: libraryName, isPublic } = library
  const [sort, setSort] = useState<CollectionItemSort>(initialSort)
  const { exit, isSelectionMode } = useLibrarySelection()
  const scope = isOwner ? 'me' : 'public'
  const { data: me } = useMeQuery()
  const adultState = getAdultState(me)
  const canAccess = hasAdultAccess(adultState)
  const enabled = scope === 'public' || isPublic || canAccess
  const shouldBlockPrivate = scope === 'me' && !isPublic && !canAccess
  const effectiveSort = isOwner ? sort : DEFAULT_COLLECTION_ITEM_SORT
  const queryInitialItems = effectiveSort === initialSort ? initialItems : undefined

  const {
    data: itemsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    isLoading,
  } = useLibraryItemsInfiniteQuery({
    libraryId,
    initialItems: queryInitialItems,
    scope,
    enabled,
    sort: effectiveSort,
  })

  const items = useMemo(() => itemsData?.pages.flatMap((page) => page.items) ?? [], [itemsData])
  const canAutoLoadMore = !shouldBlockPrivate && hasNextPage && !isFetchNextPageError
  const showLoadingSkeleton = (isLoading && items.length === 0) || isFetchingNextPage

  const infiniteScrollTriggerRef = useInfiniteScrollObserver({
    hasNextPage: canAutoLoadMore,
    isFetchingNextPage,
    fetchNextPage,
  })

  const { mangaMap } = useMangaListCachedQuery({ mangaIds: items.map((item) => item.mangaId) })

  if (shouldBlockPrivate) {
    return (
      <AdultVerificationGate
        description={`비공개 서재를 보려면 익명 성인인증이 필요해요.\n또는 서재를 공개로 전환해 주세요.`}
        title="성인인증이 필요해요"
        username={me?.name}
      />
    )
  }

  function handleSortChange(newSort: CollectionItemSort) {
    if (newSort !== sort) {
      exit()
      setSort(newSort)
      const url = new URL(window.location.href)
      url.searchParams.set('sort', String(newSort))
      window.history.replaceState({}, '', url.toString())
    }
  }

  if (items.length === 0 && !isFetchingNextPage && !isLoading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center">
        <p className="text-zinc-500">{`${libraryName} 서재가 비어 있어요`}</p>
      </div>
    )
  }

  return (
    <>
      {isOwner && (
        <div className="px-4 py-2">
          <select
            className="bg-zinc-900 text-sm px-3 py-1.5 rounded border border-zinc-800 focus:border-zinc-600 outline-none"
            onChange={(e) => handleSortChange(e.target.value as CollectionItemSort)}
            value={sort}
          >
            {COLLECTION_ITEM_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[View.CARD]} gap-2 p-2`}>
        {items.map(({ mangaId }, index) => {
          const manga = mangaMap.get(mangaId) ?? { id: mangaId, title: '불러오는 중', images: [] }

          if (!isSelectionMode) {
            return <MangaCard index={index} key={mangaId} manga={manga} />
          }

          return <SelectableMangaCard index={index} key={mangaId} manga={manga} />
        })}
        {showLoadingSkeleton && <MangaCardSkeleton />}
        {canAutoLoadMore && <div className="w-full p-4" ref={infiniteScrollTriggerRef} />}
        {!shouldBlockPrivate && isFetchNextPageError && <LoadMoreRetryButton onRetry={fetchNextPage} />}
      </ul>
    </>
  )
}
