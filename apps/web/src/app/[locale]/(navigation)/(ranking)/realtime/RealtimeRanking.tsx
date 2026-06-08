'use client'

import type { GETV1AnalyticsRealtimeResponse } from '@litomi/contracts'

import { LOCALE_LANGUAGE_TAGS } from '@litomi/domain/locale'
import { REALTIME_PAGE_VIEW_MIN_THRESHOLD } from '@litomi/domain/ranking/policy'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, Loader2, Users } from 'lucide-react'
import ms from 'ms'
import { useLocale, useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

import { useRealtimeStore } from './store'

export default function RealtimeRanking() {
  const isLive = useRealtimeStore((store) => store.isLive)
  const locale = useLocale()
  const t = useTranslations('RealtimeRanking')

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
              <p className="text-sm text-zinc-400">{t('activeUsersLabel')}</p>
              <p className="mt-2 text-5xl font-bold animate-fade-in [animation-delay:0.5s] [animation-fill-mode:both]">
                {isLoading ? (
                  <Loader2 className="size-12 p-2 animate-spin" />
                ) : (
                  (data?.totalActiveUsers.toLocaleString(LOCALE_LANGUAGE_TAGS[locale]) ?? '-')
                )}
              </p>
            </div>
            <div className="flex size-20 items-center justify-center rounded-full bg-zinc-700/50">
              <Users className="size-10 text-brand" />
            </div>
          </div>
          <div className="mt-4 text-xs text-zinc-500">
            {t('lastUpdated', {
              time: data ? new Date(data.timestamp).toLocaleTimeString(LOCALE_LANGUAGE_TAGS[locale]) : '-',
            })}
          </div>
        </div>
        <p className="text-xs mt-2 text-center text-zinc-500">{t('privacyNotice')}</p>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-xl bg-red-900/20 p-6 text-red-400">
          <p className="font-semibold">{t('errorTitle')}</p>
          <p className="mt-1 text-sm">{t('errorDescription')}</p>
        </div>
      )}

      {/* Page Ranking */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">{t('popularPagesTitle')}</h2>
        <div className="overflow-hidden rounded-lg bg-zinc-900">
          {data && data.pageRanking.length > 0 && (
            <table className="w-full">
              <thead className="border-b border-zinc-800 whitespace-nowrap">
                <tr>
                  <th className="p-4 py-3 text-left text-sm font-medium text-zinc-400">{t('rankColumn')}</th>
                  <th className="py-3 text-left text-sm font-medium text-zinc-400">{t('pageTitleColumn')}</th>
                  <th className="p-4 py-3 text-right text-sm font-medium text-zinc-400">{t('viewCountColumn')}</th>
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
                      <span className="text-sm font-semibold text-brand tabular-nums">
                        {item.activeUsers.toLocaleString(LOCALE_LANGUAGE_TAGS[locale])}
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
            {t('thresholdNotice', { count: 20, threshold: REALTIME_PAGE_VIEW_MIN_THRESHOLD })}
          </p>
        )}
      </div>
    </>
  )
}

async function fetchRealtimeAnalytics(): Promise<GETV1AnalyticsRealtimeResponse> {
  const url = '/api/v1/analytics/realtime'
  const { data } = await fetchAPIData<GETV1AnalyticsRealtimeResponse>(url, { credentials: 'omit' })
  return data
}
