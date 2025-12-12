'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { List, RowComponentProps, useListRef } from 'react-window'

import IconSpinner from '@/components/icons/IconSpinner'
import { QueryKeys } from '@/constants/query'
import { WebtoonList, WebtoonListItem } from '@/crawler/webtoon/types'
import { handleResponseError } from '@/utils/react-query-error'

type ListQueryParams = {
  provider: string
  domain: string
}

type RowData = {
  items: WebtoonListItem[]
  columns: number
  provider: string
  domain: string
  onLoadMore: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
}

type WebtoonCardProps = {
  item: WebtoonListItem
  provider: string
  domain: string
}

const GAP = 12
const PADDING_X = 12
const INFO_HEIGHT = 72

export default function WebtoonListPage() {
  const searchParams = useSearchParams()
  const provider = searchParams.get('provider') ?? ''
  const domain = searchParams.get('domain') ?? ''
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useListRef(null)
  const [containerWidth, setContainerWidth] = useState(0)

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useWebtoonListInfiniteQuery({
    provider,
    domain,
  })

  const items = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        const maxWidth = Math.min(entry.contentRect.width, 1152) // max-w-6xl = 72rem = 1152px
        setContainerWidth(maxWidth)
      }
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [isLoading])

  const columns = getColumnCount(containerWidth)
  const rowCount = Math.ceil(items.length / columns) + 1 // +1 for load more row
  const rowHeight = getRowHeight(containerWidth, columns)

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <IconSpinner className="size-8" />
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-2">
          <p className="text-zinc-500">웹툰 목록을 불러올 수 없어요</p>
          <p className="text-zinc-600 text-sm">{error?.message}</p>
        </div>
      )
    }

    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-2">
          <p className="text-zinc-500">웹툰이 없어요</p>
        </div>
      )
    }

    if (containerWidth === 0) {
      return null
    }

    return (
      <div className="h-full">
        <List
          className="px-3 py-4"
          listRef={listRef}
          overscanCount={3}
          rowComponent={WebtoonRow}
          rowCount={rowCount}
          rowHeight={rowHeight}
          rowProps={{
            items,
            columns,
            provider,
            domain,
            onLoadMore: handleLoadMore,
            hasNextPage,
            isFetchingNextPage,
          }}
        />
      </div>
    )
  }

  return (
    <div className="h-dvh flex flex-col bg-zinc-950 overflow-hidden" ref={containerRef}>
      <header className="shrink-0 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-lg font-bold text-white">웹툰</h1>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full overflow-hidden">{renderContent()}</main>
    </div>
  )
}

function getColumnCount(width: number): number {
  if (width >= 1024) return 6 // lg
  if (width >= 768) return 5 // md
  if (width >= 640) return 4 // sm
  return 3 // default
}

function getRowHeight(containerWidth: number, columns: number): number {
  const availableWidth = containerWidth - PADDING_X * 2 - GAP * (columns - 1)
  const cardWidth = availableWidth / columns
  const thumbnailHeight = (cardWidth * 4) / 3 // 3:4 aspect ratio
  return thumbnailHeight + INFO_HEIGHT + GAP
}

function LoadMoreTrigger({ onLoadMore }: { onLoadMore: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore()
        }
      },
      { threshold: 0 },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [onLoadMore])

  return <div className="h-8" ref={ref} />
}

function useWebtoonListInfiniteQuery({ provider, domain }: ListQueryParams) {
  return useInfiniteQuery<WebtoonList>({
    queryKey: QueryKeys.webtoonList(provider, domain),
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ domain })
      if (pageParam) {
        params.set('cursor', pageParam as string)
      }
      const response = await fetch(`/api/proxy/webtoon/${provider}?${params}`)
      return handleResponseError<WebtoonList>(response)
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
    enabled: Boolean(provider && domain),
  })
}

function WebtoonCard({ item, provider, domain }: WebtoonCardProps) {
  const seriesPath = item.path.replace(/^\//, '')

  return (
    <Link
      className="flex flex-col overflow-hidden rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors"
      href={`/webtoon/series?provider=${provider}&domain=${domain}&path=${encodeURIComponent(seriesPath)}`}
    >
      {/* 썸네일 */}
      <div className="relative aspect-3/4 bg-zinc-800 overflow-hidden">
        {item.thumbnail ? (
          <img alt={item.title} className="w-full h-full object-cover" loading="lazy" src={item.thumbnail} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <span className="text-2xl">📚</span>
          </div>
        )}

        {/* 성인 뱃지 */}
        {item.isAdult && (
          <div className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            19
          </div>
        )}

        {/* 업데이트 날짜 */}
        {item.updatedAt && (
          <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
            {item.updatedAt}
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="p-2 flex flex-col gap-0.5">
        <h3 className="text-sm font-medium text-zinc-100 truncate">{item.title}</h3>
        {item.genre && <p className="text-xs text-zinc-500 truncate">{item.genre}</p>}
        {item.likes !== undefined && (
          <p className="text-xs text-zinc-600">
            <span className="mr-0.5">♥</span>
            {item.likes}
          </p>
        )}
      </div>
    </Link>
  )
}

function WebtoonRow({
  index,
  style,
  items,
  columns,
  provider,
  domain,
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
}: RowComponentProps<RowData>) {
  const totalRows = Math.ceil(items.length / columns)
  const isLoadMoreRow = index === totalRows

  // Load more row
  if (isLoadMoreRow) {
    return (
      <div className="flex justify-center items-center" style={style}>
        {isFetchingNextPage ? (
          <IconSpinner className="size-6" />
        ) : hasNextPage ? (
          <LoadMoreTrigger onLoadMore={onLoadMore} />
        ) : null}
      </div>
    )
  }

  const startIndex = index * columns
  const rowItems = items.slice(startIndex, startIndex + columns)

  return (
    <div className="grid gap-3" style={{ ...style, gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {rowItems.map((item) => (
        <WebtoonCard domain={domain} item={item} key={item.path} provider={provider} />
      ))}
    </div>
  )
}
