import { useTranslations } from 'next-intl'
import { twMerge } from 'tailwind-merge'

type Props = {
  rank: number
  className?: string
}

export default function MangaCardRankBadge({ rank, className = '' }: Props) {
  const t = useTranslations('Common.mangaCard.rank')
  const isTopRank = rank <= 3

  return (
    <div
      className={twMerge(
        'pointer-events-none absolute z-10 inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-background/90 px-2 text-xs font-semibold tabular-nums text-foreground',
        isTopRank && 'text-brand',
        className,
      )}
    >
      <span className="sr-only">{t('prefix')}</span>
      {rank}
      <span className="sr-only">{t('suffix')}</span>
    </div>
  )
}
