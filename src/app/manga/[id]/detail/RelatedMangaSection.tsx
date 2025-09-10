'use client'

import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import MangaCardImage from '@/components/card/MangaCardImage'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import { Manga } from '@/types/manga'

import { useMangaQuery } from '../useMangaQuery'

type Props = {
  mangaId: number
}

export default function RelatedMangaSection({ mangaId }: Props) {
  const { data: manga, isLoading: isMangaLoading } = useMangaQuery(mangaId)
  const relatedIds = manga?.related ?? []
  const { mangaMap, isLoading: isRelatedLoading, isFetching } = useMangaListCachedQuery({ mangaIds: relatedIds })
  const direct = manga ? relatedIds.map((id) => mangaMap.get(id)).filter((m): m is Manga => Boolean(m)) : []
  const hasRecommendations = direct.length > 0
  const hasMore = direct.length > 10
  const [showAll, setShowAll] = useState(false)

  // Loading state
  if (isMangaLoading) {
    return <LoadingSkeleton />
  }

  // Empty state when no recommendations
  if (!hasRecommendations && !isRelatedLoading) {
    return <EmptyState mangaId={mangaId} />
  }

  return (
    <section className="px-4 py-3 border-b border-zinc-800">
      {/* Compact Header */}
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="size-4 text-brand-end" />
        <h3 className="text-sm font-semibold">히토미 관련 작품</h3>
        {direct.length > 0 && <span className="text-xs text-zinc-500">({direct.length})</span>}
        {hasMore && (
          <button
            className="ml-auto text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
            onClick={() => setShowAll(!showAll)}
            type="button"
          >
            {showAll ? (
              <>접기</>
            ) : (
              <>
                모두 보기
                <ArrowRight className="size-3" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Horizontal Scrolling Content */}
      {isRelatedLoading || isFetching ? (
        <LoadingContentCompact />
      ) : (
        <div className="relative">
          <ul className="flex gap-2 overflow-x-auto scrollbar-hidden pb-1 snap-x snap-mandatory">
            {direct.slice(0, showAll ? undefined : 10).map((manga, index) => (
              <li
                className="flex-shrink-0 animate-fade-in snap-start"
                key={manga.id}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <MangaCardImage
                  className="w-32 sm:w-36 bg-zinc-900 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors
                  [&_img]:snap-start [&_img]:flex-shrink-0 [&_img]:w-full [&_img]:aspect-[3/4] [&_img]:object-cover"
                  manga={manga}
                  mangaIndex={index}
                />
              </li>
            ))}

            {/* Show remaining count if not expanded */}
            {!showAll && direct.length > 10 && (
              <li className="flex-shrink-0 flex items-center justify-center w-24 sm:w-28">
                <button
                  className="flex flex-col items-center justify-center w-full h-full text-zinc-500 hover:text-white transition-colors"
                  onClick={() => setShowAll(true)}
                  type="button"
                >
                  <span className="text-2xl font-bold">+{direct.length - 10}</span>
                  <span className="text-xs">더 보기</span>
                </button>
              </li>
            )}
          </ul>

          {/* Fade edges for scroll indication */}
          {direct.length > 5 && (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            </>
          )}
        </div>
      )}
    </section>
  )
}

// Empty state - compact version
function EmptyState({ mangaId: _mangaId }: { mangaId: number }) {
  return (
    <section className="px-4 py-3 border-b border-zinc-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-zinc-600" />
          <span className="text-sm text-zinc-500">관련 작품이 없어요</span>
        </div>
        <div className="flex gap-2">
          <Link
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs font-medium transition-colors"
            href="/search?sort=popular"
          >
            인기 작품
          </Link>
          <Link
            className="px-3 py-1 bg-brand-end/10 hover:bg-brand-end/20 text-brand-end rounded text-xs font-medium transition-colors"
            href="/search?sort=random"
          >
            랜덤 작품
          </Link>
        </div>
      </div>
    </section>
  )
}

// Loading content - compact horizontal version
function LoadingContentCompact() {
  return (
    <ul className="flex gap-2 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <li className="flex-shrink-0" key={i}>
          <div className="w-32 sm:w-36 aspect-[3/4] bg-zinc-800 rounded-lg animate-pulse" />
        </li>
      ))}
    </ul>
  )
}

// Loading skeleton - compact version
function LoadingSkeleton() {
  return (
    <section className="px-4 py-3 border-b border-zinc-800">
      <div className="flex items-center gap-2 mb-2">
        <div className="size-4 bg-zinc-800 rounded animate-pulse" />
        <div className="h-4 w-20 bg-zinc-800 rounded animate-pulse" />
      </div>
      <ul className="flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <li className="flex-shrink-0" key={i}>
            <div className="w-32 sm:w-36 aspect-[3/4] bg-zinc-800 rounded-lg animate-pulse" />
          </li>
        ))}
      </ul>
    </section>
  )
}
