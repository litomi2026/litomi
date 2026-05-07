import { twMerge } from 'tailwind-merge'

type Props = {
  className?: string
}

export function TopStickySafeAreaSurface({ className }: Props) {
  return (
    <div
      aria-hidden
      className={twMerge(
        'pointer-events-none sticky top-0 z-20 -mb-(--safe-area-top) h-(--safe-area-top) bg-background',
        className,
      )}
    />
  )
}
