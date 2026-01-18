'use client'

import { useMemo } from 'react'

import { GETLibraryItemsResponse } from '@/backend/api/v1/library/[id]/item/GET'
import AdultVerificationGate from '@/components/AdultVerificationGate'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import LoadMoreRetryButton from '@/components/ui/LoadMoreRetryButton'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import useLibraryItemsInfiniteQuery from '@/query/useLibraryItemsInfiniteQuery'
import useMeQuery from '@/query/useMeQuery'
import { canAccessAdultRestrictedAPIs } from '@/utils/adult-verification'
import { View } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

import SelectableMangaCard from '../SelectableMangaCard'
import { useLibrarySelectionStore } from './librarySelection'

type Props = {
  library: {
    id: number
    name: string
    isPublic: boolean
  }
  initialItems: GETLibraryItemsResponse
  isOwner: boolean
}

export default function LibraryItemsClient({ library, initialItems, isOwner }: Readonly<Props>) {
  const { id: libraryId, name: libraryName, isPublic } = library
  const { isSelectionMode } = useLibrarySelectionStore()
  const scope = isOwner ? 'me' : 'public'
  const { data: me } = useMeQuery()
  const canAccess = canAccessAdultRestrictedAPIs(me)
  const enabled = scope === 'public' || isPublic || canAccess
  const shouldBlockPrivate = scope === 'me' && !isPublic && !canAccess

  const {
    data: itemsData,
    fetchNextPage: fetchMoreItems,
    hasNextPage: hasMoreItemsToLoad,
    isFetchingNextPage: isLoadingMoreItems,
    isFetchNextPageError: isFetchMoreItemsError,
  } = useLibraryItemsInfiniteQuery({ libraryId, initialItems, scope, enabled })

  const items = useMemo(() => itemsData?.pages.flatMap((page) => page.items) ?? [], [itemsData])
  const canAutoLoadMore = !shouldBlockPrivate && hasMoreItemsToLoad && !isFetchMoreItemsError

  const infiniteScrollTriggerRef = useInfiniteScrollObserver({
    hasNextPage: canAutoLoadMore,
    isFetchingNextPage: isLoadingMoreItems,
    fetchNextPage: fetchMoreItems,
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

  if (items.length === 0 && !isLoadingMoreItems) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center">
        <p className="text-zinc-500">{`${libraryName} 서재가 비어 있어요`}</p>
      </div>
    )
  }

  return (
    <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[View.CARD]} gap-2 p-2`}>
      {items.map(({ mangaId }, index) => {
        const manga = mangaMap.get(mangaId) ?? { id: mangaId, title: '불러오는 중', images: [] }

        if (!isSelectionMode) {
          return <MangaCard index={index} key={mangaId} manga={manga} />
        }

        return <SelectableMangaCard index={index} key={mangaId} manga={manga} />
      })}
      {isLoadingMoreItems && <MangaCardSkeleton />}
      {canAutoLoadMore && <div className="w-full p-4" ref={infiniteScrollTriggerRef} />}
      {!shouldBlockPrivate && isFetchMoreItemsError && <LoadMoreRetryButton onRetry={fetchMoreItems} />}
    </ul>
  )
}
