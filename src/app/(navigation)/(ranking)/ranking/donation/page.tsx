import { Heart } from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'

import NonAdultJuicyAdsBanner from '@/components/ads/juicy-ads/NonAdultJuicyAdsBanner'
import { generateOpenGraphMetadata } from '@/constants'
import { formatNumber } from '@/utils/format/number'

import { getDonationRanking } from './query'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '후원 랭킹',
  ...generateOpenGraphMetadata({
    title: '후원 랭킹',
    url: '/ranking/donation',
  }),
  alternates: {
    canonical: '/ranking/donation',
    languages: { ko: '/ranking/donation' },
  },
}

export default async function Page() {
  return (
    <div className="p-2">
      <NonAdultJuicyAdsBanner className="mb-2" />
      <details className="max-w-3xl mx-auto m-4 rounded-xl bg-white/4 border border-white/7">
        <summary className="cursor-pointer list-none px-4 py-3 flex items-center gap-2 text-sm text-zinc-200 [&::-webkit-details-marker]:hidden">
          <Heart className="size-4 text-zinc-400" />
          <span className="font-medium">후원한 만큼 작가에게 돌아가요</span>
          <span className="ml-auto text-xs text-zinc-500">자세히</span>
        </summary>
        <div className="px-4 pb-4 text-sm text-zinc-400">
          후원해주신 리보는 모두 작가님을 응원하는 데 사용돼요. 획득한 리보로 좋아하는 작품의 창작자를 후원해보세요.
        </div>
      </details>
      <div className="max-w-3xl mx-auto grid gap-4 overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800">
        <table className="w-full">
          <thead className="border-b border-zinc-800 whitespace-nowrap">
            <tr>
              <th className="p-4 py-3 text-left text-sm font-medium text-zinc-400">순위</th>
              <th className="py-3 text-left text-sm font-medium text-zinc-400">대상</th>
              <th className="p-4 py-3 text-right text-sm font-medium text-zinc-400">총 후원</th>
            </tr>
          </thead>
          <DonationRankingBody />
        </table>
      </div>
    </div>
  )
}

async function DonationRankingBody() {
  const items = await getDonationRanking()

  return (
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
            아직 후원 데이터가 없어요
          </td>
        </tr>
      )}
    </tbody>
  )
}
