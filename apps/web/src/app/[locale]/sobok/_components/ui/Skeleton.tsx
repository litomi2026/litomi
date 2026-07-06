import { twMerge } from 'tailwind-merge'

// Two layers: the outer div fades in after a short delay (space is reserved immediately, but
// fast loads never flash a skeleton), the inner div pulses — the two animations both drive
// opacity, so they must live on separate elements.
export default function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={twMerge('animate-skeleton-appear rounded-lg', className)}>
      <div className="h-full w-full animate-pulse rounded-[inherit] bg-foreground/10" />
    </div>
  )
}
