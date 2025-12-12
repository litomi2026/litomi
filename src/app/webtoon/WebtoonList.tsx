'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

import IconSpinner from '@/components/icons/IconSpinner'
import { QueryKeys } from '@/constants/query'
import { WebtoonList, WebtoonListItem } from '@/crawler/webtoon/types'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import { handleResponseError } from '@/utils/react-query-error'

type ListQueryParams = {
  provider: string
  domain: string
}

type WebtoonCardProps = {
  item: WebtoonListItem
  provider: string
  domain: string
}

export default function WebtoonListPage() {
  const searchParams = useSearchParams()
  const provider = searchParams.get('provider') ?? ''
  const domain = searchParams.get('domain') ?? ''

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useWebtoonListInfiniteQuery({
    provider,
    domain,
  })

  const items = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data])

  const loadMoreRef = useInfiniteScrollObserver({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <IconSpinner className="size-8" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh gap-2">
        <p className="text-zinc-500">웹툰 목록을 불러올 수 없어요</p>
        <p className="text-zinc-600 text-sm">{error?.message}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh gap-2">
        <p className="text-zinc-500">웹툰이 없어요</p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-zinc-950">
      <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-lg font-bold text-white">웹툰</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 py-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {items.map((item) => (
            <WebtoonCard domain={domain} item={item} key={item.path} provider={provider} />
          ))}
        </div>

        {/* Load more trigger */}
        <div className="flex justify-center py-8" ref={loadMoreRef}>
          {isFetchingNextPage && <IconSpinner className="size-6" />}
        </div>
      </main>
    </div>
  )
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
