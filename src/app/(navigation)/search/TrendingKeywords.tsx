'use client'

import { useMemo, useState } from 'react'

import KeywordLink from './KeywordLink'
import useTrendingKeywordsQuery from './useTrendingKeywordsQuery'

export default function TrendingKeywords() {
  const { data } = useTrendingKeywordsQuery()
  const [currentIndex, setCurrentIndex] = useState(0)

  const trendingKeywords = useMemo(
    () => (data && data.keywords.length > 0 ? data.keywords : [{ keyword: 'language:korean' }]),
    [data],
  )

  return (
    <>
      {/* Mobile */}
      <div className="relative grid gap-2 sm:hidden">
        <div className="flex items-center justify-between text-zinc-500 text-xs">
          <span>인기 검색어</span>
          {trendingKeywords.length > 1 && (
            <span className="text-zinc-600">
              {currentIndex + 1} / {trendingKeywords.length}
            </span>
          )}
        </div>
        <div className="flex gap-1.5 px-1 overflow-x-auto scrollbar-hidden snap-x snap-mandatory scroll-smooth">
          {trendingKeywords.map(({ keyword }, index) => (
            <KeywordLink
              ariaCurrent={currentIndex === index}
              className="max-w-full snap-center aria-current:bg-zinc-700 aria-current:text-zinc-100"
              index={index}
              key={keyword}
              keyword={keyword}
              // onClick={() => handleKeywordClick(index)}
            />
          ))}
        </div>
        <div className="px-3">
          <div className="flex gap-0.5 justify-center overflow-x-auto max-w-full">
            {trendingKeywords.map(({ keyword }, i) => (
              <button
                aria-current={currentIndex === i}
                aria-label={`Keyword ${i + 1}`}
                className="rounded-full transition-all flex-shrink-0 size-1.5 bg-zinc-600 hover:bg-zinc-500 aria-current:w-6 aria-current:bg-zinc-400"
                key={keyword}
                // onClick={() => handleIndicatorClick(i)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden sm:grid grid-cols-[auto_1fr] items-center gap-2 rounded-lg md:px-3 md:p-2 md:bg-zinc-900/50">
        <div className="flex items-center gap-1 py-1 text-zinc-500 text-xs">
          <span>인기</span>
          <span className="hidden sm:inline">검색어</span>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hidden">
          {trendingKeywords.map(({ keyword }, index) => (
            <KeywordLink
              index={index}
              key={keyword}
              keyword={keyword}
              textClassName="truncate max-w-[50svw] sm:max-w-[25svw]"
            />
          ))}
        </div>
      </div>
    </>
  )
}
