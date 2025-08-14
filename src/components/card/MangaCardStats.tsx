import { Bookmark, Eye, Heart, Star } from 'lucide-react'
import { memo } from 'react'

import { Manga } from '@/types/manga'
import { formatNumber } from '@/utils/format'

type Props = {
  manga: Manga
  className?: string
}

export default memo(MangaCardStats)

function MangaCardStats({ manga, className = '' }: Readonly<Props>) {
  const { rating = 0, ratingCount = 0, viewCount = 0, like = 0, likeAnonymous = 0, bookmarkCount = 0 } = manga
  const totalLikes = like + likeAnonymous

  const hasStats = rating > 0 || viewCount > 0 || totalLikes > 0 || bookmarkCount > 0

  if (!hasStats) {
    return null
  }

  return (
    <div className={`flex items-center gap-2.5 text-zinc-400 ${className}`}>
      {viewCount > 0 && (
        <div className="flex items-center gap-1.5">
          <Eye className="size-[1em] shrink-0" />
          <span className="tabular-nums">{formatNumber(viewCount, 'ko')}</span>
        </div>
      )}
      {bookmarkCount > 0 && (
        <div className="flex items-center gap-1.5">
          <Bookmark className="size-[1em] shrink-0 text-blue-400" />
          <span className="tabular-nums">{formatNumber(bookmarkCount, 'ko')}</span>
        </div>
      )}
      {rating > 0 && (
        <div className="flex items-center gap-1.5">
          <Star className="size-[1em] shrink-0 text-yellow-500" />
          <span className="font-medium tabular-nums">
            {rating.toFixed(1)}
            {ratingCount && (
              <span className="text-zinc-500 font-normal ml-0.5">({formatNumber(ratingCount, 'ko')}개)</span>
            )}
          </span>
        </div>
      )}
      {totalLikes > 0 && (
        <div className="flex items-center gap-1.5">
          <Heart className="size-[1em] shrink-0 text-red-400" />
          <span className="tabular-nums">{formatNumber(totalLikes, 'ko')}</span>
        </div>
      )}
    </div>
  )
}
