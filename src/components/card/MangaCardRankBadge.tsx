import { twMerge } from 'tailwind-merge'

type Props = {
  rank: number
  className?: string
}

export default function MangaCardRankBadge({ rank, className = '' }: Readonly<Props>) {
  const isTopRank = rank <= 3

  return (
    <div
      className={twMerge(
        'pointer-events-none absolute z-10 inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-background/90 px-2 text-xs font-semibold tabular-nums text-foreground',
        isTopRank && 'text-brand',
        className,
      )}
    >
      <span className="sr-only">현재 순위 </span>
      {rank}
      <span className="sr-only">위</span>
    </div>
  )
}
