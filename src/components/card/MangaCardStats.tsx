import { Bookmark, Eye, Heart, Star } from 'lucide-react'

import { formatNumber } from '@/utils/format/number'

type Props = {
  manga: {
    rating?: number
    ratingCount?: number
    viewCount?: number
    like?: number
    likeAnonymous?: number
    bookmarkCount?: number
  }
  className?: string
}

export default function MangaCardStats({ manga, className = '' }: Props) {
  const { rating = 0, ratingCount = 0, viewCount, like = 0, likeAnonymous = 0, bookmarkCount = 0 } = manga
  const totalLikes = like + likeAnonymous

  return (
    <div className={`flex items-center gap-2.5 text-sm text-zinc-400 ${className}`}>
      <div className="flex items-center gap-1.5">
        <Eye className="size-[1em] shrink-0" />
        <span className="tabular-nums">{formatNumber(viewCount ?? 0, 'ko')}</span>
      </div>
      {bookmarkCount > 0 && (
        <div className="flex items-center gap-1.5">
          <Bookmark className="size-[1em] shrink-0 text-brand" />
          <span className="tabular-nums">{formatNumber(bookmarkCount, 'ko')}</span>
        </div>
      )}
      {rating > 0 && (
        <div className="flex items-center">
          <RatingStars rating={rating} />
          {ratingCount > 0 && (
            <span className="text-zinc-500 text-xs ml-0.5">({formatNumber(ratingCount, 'ko')}개)</span>
          )}
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

function RatingStars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating)
  const partialStar = rating % 1
  const hasPartialStar = partialStar > 0
  const emptyStars = 5 - fullStars - (hasPartialStar ? 1 : 0)

  return (
    <div aria-label={`평점 ${rating.toFixed(1)}점`} className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star className="size-[1em] shrink-0 text-brand" key={`full-${i}`} />
      ))}
      {hasPartialStar && (
        <div className="relative size-[1em] shrink-0">
          <div className="absolute z-10 inset-0 overflow-hidden" style={{ width: `${partialStar * 100}%` }}>
            <Star className="size-[1em] shrink-0 text-brand" />
          </div>
          <Star className="size-[1em] absolute inset-0 text-zinc-600" />
        </div>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star className="size-[1em] shrink-0 text-zinc-600" key={`empty-${i}`} />
      ))}
    </div>
  )
}
