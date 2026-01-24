import { Metadata } from 'next'
import Link from 'next/link'

import { generateOpenGraphMetadata } from '@/constants'
import { formatNumber } from '@/utils/format/number'

import { getDonationRanking } from './query'

export const dynamic = 'force-static'
export const revalidate = 86400

export const metadata: Metadata = {
  title: '기부 랭킹',
  ...generateOpenGraphMetadata({
    title: '기부 랭킹',
    url: '/ranking/donation',
  }),
  alternates: {
    canonical: '/ranking/donation',
    languages: { ko: '/ranking/donation' },
  },
}

export default async function Page() {
  const items = await getDonationRanking()

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-3xl mx-auto grid gap-4 overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800">
        <table className="w-full">
          <thead className="border-b border-zinc-800 whitespace-nowrap">
            <tr>
              <th className="p-4 py-3 text-left text-sm font-medium text-zinc-400">순위</th>
              <th className="py-3 text-left text-sm font-medium text-zinc-400">대상</th>
              <th className="p-4 py-3 text-right text-sm font-medium text-zinc-400">총 기부</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                className="border-b border-zinc-800 last:border-b-0 transition hover:bg-zinc-800/50"
                key={`${item.type}:${item.value}`}
              >
                <td className="p-4 py-3 text-sm">
                  <span className="font-semibold text-zinc-400">#{index + 1}</span>
                </td>
                <td className="p-0">
                  <Link
                    className="flex items-center gap-2 min-w-0 px-4 py-3 hover:underline"
                    href={`/search?${new URLSearchParams({ query: `${item.type}:${item.value}` })}`}
                    prefetch={false}
                    title="검색으로 이동"
                  >
                    <span className="text-xs text-zinc-500 shrink-0">{item.type === 'artist' ? '작가' : '단체'}</span>
                    <span className="text-sm font-medium text-foreground line-clamp-1">{item.label}</span>
                  </Link>
                </td>
                <td className="p-4 py-3 text-right">
                  <span className="text-sm font-semibold text-brand tabular-nums">
                    {formatNumber(item.totalReceived)} 리보
                  </span>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="p-6 text-sm text-zinc-500" colSpan={3}>
                  아직 기부 데이터가 없어요
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
