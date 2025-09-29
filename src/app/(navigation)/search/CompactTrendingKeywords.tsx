'use client'

import Link from 'next/link'

import LinkPending from '@/components/LinkPending'

import useTrendingKeywordsQuery from './useTrendingKeywordsQuery'

export default function CompactTrendingKeywords() {
  const { data } = useTrendingKeywordsQuery()
  const trendingKeywords = data?.keywords.length ? data.keywords : [{ keyword: 'language:korean' }]

  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-2 rounded-lg md:px-3 md:p-2 md:bg-zinc-900/50">
      <div className="flex items-center gap-2 py-1 text-zinc-500">
        <span className="text-xs">인기 검색어</span>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hidden">
        {trendingKeywords.map((item, index) => (
          <Link
            className="flex items-center gap-1 relative text-xs px-2.5 py-1 rounded-full max-w-[30svw] overflow-hidden bg-zinc-800 text-zinc-400 transition
            hover:text-white hover:bg-zinc-700"
            href={`/search?query=${item.keyword}`}
            key={item.keyword}
            title={item.keyword}
          >
            {index < 3 && <span className="text-[10px] font-bold text-brand-end">{index + 1}</span>}
            <span className="truncate">{item.keyword}</span>
            <LinkPending
              className="size-4"
              wrapperClassName="absolute inset-0 flex items-center justify-center animate-fade-in bg-zinc-800"
            />
          </Link>
        ))}
      </div>
    </div>
  )
}
