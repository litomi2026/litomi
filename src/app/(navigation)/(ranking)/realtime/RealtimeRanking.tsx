'use client'

import { useQuery } from '@tanstack/react-query'
import { ExternalLink, Users } from 'lucide-react'
import ms from 'ms'
import Link from 'next/link'

import IconSpinner from '@/components/icons/IconSpinner'
import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import { REALTIME_PAGE_VIEW_MIN_THRESHOLD } from '@/constants/policy'
import { QueryKeys } from '@/constants/query'

import { useRealtimeStore } from './store'

interface PageRankingItem {
  activeUsers: number
  page: string
}

interface RealtimeData {
  pageRanking: PageRankingItem[]
  timestamp: string
  totalActiveUsers: number
}

export default function RealtimeRanking() {
  const isLive = useRealtimeStore((store) => store.isLive)

  const { data, error, isLoading } = useQuery({
    queryKey: QueryKeys.realtimeAnalytics,
    queryFn: fetchRealtimeAnalytics,
    refetchInterval: isLive ? ms('1 minute') : false,
  })

  return (
    <>
      {/* Main Stats Card */}
      <div>
        <div className="rounded-xl bg-linear-to-br from-zinc-900 to-zinc-800 p-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">현재 활성 사용자</p>
              <p className="mt-2 text-5xl font-bold animate-fade-in [animation-delay:0.5s] [animation-fill-mode:both]">
                {isLoading ? <IconSpinner className="size-12 p-2" /> : (data?.totalActiveUsers.toLocaleString() ?? '-')}
              </p>
            </div>
            <div className="flex size-20 items-center justify-center rounded-full bg-zinc-700/50">
              <Users className="size-10 text-brand" />
            </div>
          </div>
          <div className="mt-4 text-xs text-zinc-500">
            마지막 업데이트: {data && new Date(data.timestamp).toLocaleTimeString('ko-KR')}
          </div>
        </div>
        <p className="text-xs mt-2 text-center text-zinc-500">
          개인정보 보호를 위해 활성 사용자 정보는 익명으로 처리되고 있어요
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-xl bg-red-900/20 p-6 text-red-400">
          <p className="font-semibold">데이터를 불러올 수 없습니다</p>
          <p className="mt-1 text-sm">잠시 후 다시 시도해주세요.</p>
        </div>
      )}

      {/* Page Ranking */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">실시간 인기 페이지</h2>
        <div className="overflow-hidden rounded-lg bg-zinc-900">
          {data && data.pageRanking.length > 0 && (
            <table className="w-full">
              <thead className="border-b border-zinc-800 whitespace-nowrap">
                <tr>
                  <th className="p-4 py-3 text-left text-sm font-medium text-zinc-400">순위</th>
                  <th className="py-3 text-left text-sm font-medium text-zinc-400">페이지 제목</th>
                  <th className="p-4 py-3 text-right text-sm font-medium text-zinc-400">조회수</th>
                </tr>
              </thead>
              <tbody>
                {data.pageRanking.map((item, index) => (
                  <tr className="border-b border-zinc-800 transition hover:bg-zinc-800/50" key={item.page}>
                    <td className="p-4 py-3 text-sm">
                      <span className="font-semibold text-zinc-400">#{index + 1}</span>
                    </td>
                    <td className="">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          className="py-3 flex-1 hover:underline"
                          href={`/search?query=${item.page}`}
                          prefetch={false}
                        >
                          <p className="text-sm font-medium text-foreground line-clamp-1">{item.page}</p>
                        </Link>
                        <a
                          className="text-xs p-2 -m-2 text-zinc-400 shrink-0 whitespace-nowrap hover:underline flex items-center gap-1"
                          href={`https://www.google.com/search?q=site:litomi.in+${item.page}`}
                          target="_blank"
                        >
                          <span className="hidden sm:inline">Google</span> <ExternalLink className="size-3" />
                        </a>
                      </div>
                    </td>
                    <td className="p-4 py-3 text-right">
                      <span className="text-sm font-semibold text-brand">{item.activeUsers.toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {data?.pageRanking.length === 20 && (
          <p className="mt-2 text-center text-xs text-zinc-500">
            조회수가 {REALTIME_PAGE_VIEW_MIN_THRESHOLD} 이상인 상위 20개 페이지만 표시돼요
          </p>
        )}
      </div>
    </>
  )
}

async function fetchRealtimeAnalytics(): Promise<RealtimeData> {
  const response = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/api/v1/analytics/realtime`)
  if (!response.ok) {
    throw new Error('Failed to fetch analytics data')
  }
  return response.json()
}
