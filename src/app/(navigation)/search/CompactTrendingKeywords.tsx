'use client'

import { TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

import useTrendingKeywordsQuery from './useTrendingKeywordsQuery'

export default function CompactTrendingKeywords() {
  const router = useRouter()
  const { data } = useTrendingKeywordsQuery()

  const handleClick = (keyword: string) => {
    const params = new URLSearchParams()
    params.set('query', keyword)
    router.push(`/search?${params}`)
  }

  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-2 mb-2 rounded-lg md:px-3 md:p-2 md:bg-zinc-900/50">
      <div className="flex items-center gap-2 py-1 text-zinc-500">
        <TrendingUp className="size-4" />
        <span className="text-xs">인기</span>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hidden">
        {data?.keywords.map((item, index) => (
          <button
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full max-w-[30svw] bg-zinc-800 text-zinc-400 transition
            hover:text-white hover:bg-zinc-700"
            key={item.keyword}
            onClick={() => handleClick(item.keyword)}
          >
            {index < 3 && <span className="text-[10px] font-bold text-brand-end">{index + 1}</span>}
            <span className="truncate">{item.keyword}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
