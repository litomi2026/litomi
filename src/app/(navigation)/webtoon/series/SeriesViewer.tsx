'use client'

import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { QueryKeys } from '@/constants/query'
import { WebtoonSeries } from '@/crawler/webtoon/types'
import { env } from '@/env/client'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_EXTERNAL_API_PROXY_URL } = env

type EpisodeListProps = {
  series: WebtoonSeries
  provider: string
  domain: string
}

type SeriesQueryParams = {
  provider: string
  domain: string
  path: string
}

export default function SeriesViewer() {
  const searchParams = useSearchParams()
  const provider = searchParams.get('provider') ?? ''
  const domain = searchParams.get('domain') ?? ''
  const path = searchParams.get('path') ?? ''
  const { data: series, isLoading, error } = useSeriesQuery({ provider, domain, path })

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  if (error || !series) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        <p className="text-zinc-500">시리즈 정보를 불러올 수 없어요</p>
        <p className="text-zinc-600 text-sm">{error?.message}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-zinc-950">
      <SeriesHeader series={series} />
      <EpisodeList domain={domain} provider={provider} series={series} />
    </div>
  )
}

function EpisodeList({ series, provider, domain }: EpisodeListProps) {
  return (
    <section className="max-w-3xl mx-auto">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-300">에피소드</h2>
      </div>

      <ul className="divide-y divide-zinc-800/50 pb-4">
        {series.episodes.map((episode) => (
          <li key={episode.path}>
            <Link
              className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900/50 active:bg-zinc-900 transition text-zinc-200 visited:text-zinc-500"
              href={`/webtoon/episode?provider=${provider}&domain=${domain}&path=${encodeURIComponent(episode.path.replace(/^\//, ''))}`}
              prefetch={false}
            >
              <span className="text-sm truncate">{episode.title}</span>
              {episode.publishedAt && (
                <span className="text-xs text-zinc-600 shrink-0 ml-2">{formatDate(episode.publishedAt)}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '오늘'
  if (days === 1) return '어제'
  if (days < 7) return `${days}일 전`

  return dateStr.slice(5).replace('-', '.')
}

function SeriesHeader({ series }: { series: WebtoonSeries }) {
  const router = useRouter()

  return (
    <header className="relative">
      {/* 배경 블러 이미지 */}
      {series.thumbnail && (
        <div className="absolute inset-0 overflow-hidden -top-(--safe-area-top)">
          <img alt="" className="w-full h-full object-cover blur-2xl opacity-30 scale-110" src={series.thumbnail} />
          <div className="absolute inset-0 bg-linear-to-b from-zinc-950/50 to-zinc-950" />
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="relative px-4 pt-8 pb-6 max-w-3xl mx-auto">
        <button
          className="absolute top-2 left-4 z-10 text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-4"
          onClick={() => router.back()}
          type="button"
        >
          ← 돌아가기
        </button>
        <div className="flex gap-4 flex-wrap">
          {/* 썸네일 */}
          {series.thumbnail && (
            <div className="rounded-lg overflow-hidden shadow-xl">
              <img alt={series.title} className="w-[480px] h-[240px] object-cover" src={series.thumbnail} />
            </div>
          )}

          {/* 정보 */}
          <div className="flex flex-col justify-end min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{series.title}</h1>

            {series.author && <p className="text-sm text-zinc-400 mt-1">{series.author}</p>}

            <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500">
              {series.totalEpisodes && <span>총 {series.totalEpisodes}화</span>}
              {series.genre && (
                <>
                  <span>·</span>
                  <span>{series.genre}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 설명 */}
        {series.description && <p className="mt-4 text-sm text-zinc-400 line-clamp-3">{series.description}</p>}
      </div>
    </header>
  )
}

function useSeriesQuery({ provider, domain, path }: SeriesQueryParams) {
  return useQuery({
    queryKey: QueryKeys.webtoonSeries(provider, domain, path),
    queryFn: async () => {
      const params = new URLSearchParams({ domain, path })
      const url = `${NEXT_PUBLIC_EXTERNAL_API_PROXY_URL}/api/proxy/webtoon/${provider}/series?${params}`
      const { data } = await fetchWithErrorHandling<WebtoonSeries>(url)
      return data
    },
    enabled: Boolean(provider && domain && path),
  })
}
