'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { List, RowComponentProps, useListRef } from 'react-window'

import CustomSelect from '@/components/ui/CustomSelect'
import { QueryKeys } from '@/constants/query'
import { WebtoonList, WebtoonListItem } from '@/crawler/webtoon/types'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

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
  hasError: boolean
}

type WebtoonCardProps = {
  item: WebtoonListItem
  provider: string
  domain: string
}

const GAP = 12
const PADDING_X = 12
const INFO_HEIGHT = 72

const PROVIDER_OPTIONS = [{ label: '툰코', value: 'toonkor' }] as const

export default function WebtoonListPage() {
  const searchParams = useSearchParams()
  const provider = searchParams.get('provider') ?? ''
  const domain = searchParams.get('domain') ?? ''
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useListRef(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const columns = getColumnCount(containerWidth)
  const rowHeight = getRowHeight(containerWidth, columns)
  const hasParams = provider && domain

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useWebtoonListInfiniteQuery({
    provider,
    domain,
  })

  const items = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data])
  const rowCount = Math.ceil(items.length / columns) + 1 // +1 for load more row
  const showList = !isLoading && items.length > 0 && containerWidth > 0

  function handleLoadMore() {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  // NOTE: 컨테이너 너비 측정
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

  if (!hasParams) {
    return (
      <div className="h-dvh flex flex-col bg-zinc-950 pt-safe pb-safe px-safe" ref={containerRef}>
        <header className="shrink-0 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <h1 className="text-lg font-bold text-white">웹툰</h1>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <form action="/webtoon" className="w-full max-w-sm flex flex-col gap-4" method="get">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-400" htmlFor="provider">
                제공자
              </label>
              <CustomSelect
                defaultValue={provider || 'toonkor'}
                id="provider"
                name="provider"
                options={PROVIDER_OPTIONS}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-400" htmlFor="domain">
                도메인
              </label>
              <input
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                defaultValue={domain || 'tkor079.com'}
                id="domain"
                name="domain"
                placeholder="tkor079.com"
                required
                type="text"
              />
              <p className="text-xs text-zinc-600">현재 접속 가능한 도메인을 입력해 주세요</p>
            </div>

            <button
              className="mt-2 bg-zinc-100 text-zinc-900 font-medium rounded-lg px-4 py-2.5 hover:bg-white transition-colors"
              type="submit"
            >
              불러오기
            </button>
          </form>
        </main>
      </div>
    )
  }

  return (
    <div className="h-dvh flex flex-col bg-zinc-950 overflow-hidden pt-safe px-safe" ref={containerRef}>
      <header className="shrink-0 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-lg font-bold text-white">웹툰</h1>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="size-8 animate-spin" />
          </div>
        )}

        {!isLoading && items.length === 0 && error && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <p className="text-zinc-500">웹툰 목록을 불러올 수 없어요</p>
            <p className="text-zinc-600 text-sm">{error?.message}</p>
          </div>
        )}

        {!isLoading && items.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <p className="text-zinc-500">웹툰이 없어요</p>
          </div>
        )}

        {showList && (
          <div className="h-full">
            <List
              className="pt-3"
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
                hasError: Boolean(error),
              }}
            />
          </div>
        )}
      </main>
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

  return <div className="h-8 pb-safe" ref={ref} />
}

function useWebtoonListInfiniteQuery({ provider, domain }: ListQueryParams) {
  return useInfiniteQuery<WebtoonList>({
    queryKey: QueryKeys.webtoonList(provider, domain),
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ domain })
      if (pageParam) {
        params.set('cursor', pageParam as string)
      }
      const { data } = await fetchWithErrorHandling<WebtoonList>(`/api/proxy/webtoon/${provider}?${params}`)
      return data
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
      className="flex flex-col overflow-hidden rounded-lg bg-zinc-900 hover:bg-zinc-800 transition text-zinc-100 visited:text-zinc-500"
      href={`/webtoon/series?provider=${provider}&domain=${domain}&path=${encodeURIComponent(seriesPath)}`}
      prefetch={false}
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
        <h3 className="text-sm font-medium truncate">{item.title}</h3>
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
  hasError,
}: RowComponentProps<RowData>) {
  const totalRows = Math.ceil(items.length / columns)
  const isLoadMoreRow = index === totalRows

  // Load more row
  if (isLoadMoreRow) {
    return (
      <div className="flex flex-col justify-center items-center gap-2 px-3" style={style}>
        {isFetchingNextPage ? (
          <Loader2 className="size-6 animate-spin" />
        ) : hasError ? (
          <button
            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors px-4 py-2"
            onClick={onLoadMore}
            type="button"
          >
            불러오기 실패 · 다시 시도
          </button>
        ) : hasNextPage ? (
          <LoadMoreTrigger onLoadMore={onLoadMore} />
        ) : null}
      </div>
    )
  }

  const startIndex = index * columns
  const rowItems = items.slice(startIndex, startIndex + columns)

  return (
    <div
      className="grid gap-3 px-3 pb-3"
      style={{ ...style, height: 'auto', gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {rowItems.map((item) => (
        <WebtoonCard domain={domain} item={item} key={item.path} provider={provider} />
      ))}
    </div>
  )
}
