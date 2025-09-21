'use client'

import { useQuery } from '@tanstack/react-query'
import { Users, View } from 'lucide-react'
import ms from 'ms'
import Link from 'next/link'
import { useState } from 'react'

import IconSpinner from '@/components/icons/IconSpinner'
import { REALTIME_PAGE_VIEW_MIN_THRESHOLD } from '@/constants/policy'
import { QueryKeys } from '@/constants/query'

interface PageRankingItem {
  activeUsers: number
  page: string
}

interface RealtimeData {
  pageRanking: PageRankingItem[]
  timestamp: string
  totalActiveUsers: number
}

export default function RealtimePage() {
  const [isLive, setIsLive] = useState(true)

  const { data, error, isLoading } = useQuery({
    queryKey: QueryKeys.realtimeAnalytics,
    queryFn: fetchRealtimeAnalytics,
    refetchInterval: isLive ? ms('1 minute') : false,
  })

  return (
    <div className="grid gap-6 mx-auto max-w-screen-sm w-full p-4">
      {/* Header */}
      <h1 className="text-3xl font-bold sr-only">실시간 방문자 현황</h1>

      {/* Live Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`size-2 rounded-full ${isLive ? 'animate-pulse bg-green-500' : 'bg-zinc-500'}`} />
          <span className="text-sm text-zinc-400">{isLive ? '실시간 업데이트 중' : '일시 정지됨'}</span>
        </div>
        <button
          className="rounded-lg bg-zinc-800 px-4 p-2 text-sm transition-colors hover:bg-zinc-700"
          onClick={() => setIsLive(!isLive)}
        >
          {isLive ? '일시 정지' : '재개'}
        </button>
      </div>

      {/* Main Stats Card */}
      <div>
        <div className="rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">현재 활성 사용자</p>
              <p className="mt-2 text-5xl font-bold animate-fade-in [animation-delay:0.5s] [animation-fill-mode:both]">
                {isLoading ? <IconSpinner className="size-12 p-2" /> : data?.totalActiveUsers.toLocaleString()}
              </p>
            </div>
            <div className="flex size-20 items-center justify-center rounded-full bg-zinc-700/50">
              <Users className="size-10 text-brand-end" />
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
              <thead className="border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">순위</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">페이지</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-zinc-400">조회수</th>
                </tr>
              </thead>
              <tbody>
                {data.pageRanking.map((item, index) => (
                  <tr className="border-b border-zinc-800 transition-colors hover:bg-zinc-800/50" key={item.page}>
                    <td className="px-4 py-3 text-sm">
                      <span className="font-semibold text-zinc-400">#{index + 1}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/search?query=${item.page}`}>
                        <p className="text-sm font-medium text-white line-clamp-1 hover:underline">{item.page}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1">
                        <View className="size-3 text-brand-end" />
                        <span className="text-sm font-semibold text-brand-end">
                          {item.activeUsers.toLocaleString()}
                        </span>
                      </span>
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
    </div>
  )
}

async function fetchRealtimeAnalytics(): Promise<RealtimeData> {
  const response = await fetch('/api/analytics/realtime')
  if (!response.ok) {
    throw new Error('Failed to fetch analytics data')
  }
  return response.json()
}
