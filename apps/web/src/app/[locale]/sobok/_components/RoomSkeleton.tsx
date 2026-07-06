import { twMerge } from 'tailwind-merge'
import PageHeader, { HeaderBackLink } from './ui/PageHeader'
import Skeleton from './ui/Skeleton'

interface MessageFeedSkeletonProps {
  // 'chat' = incoming avatar bubbles + one outgoing; 'broadcast' = outgoing-only (studio feed).
  variant?: 'broadcast' | 'chat'
  // Rooms overlay the real composer dock at the bottom — pass the dock inset here.
  className?: string
}

// Mirrors the message feed geometry so the skeleton→content swap doesn't move anything.
export function MessageFeedSkeleton({ variant = 'chat', className }: MessageFeedSkeletonProps) {
  return (
    <div
      className={twMerge(
        'mx-auto flex w-full max-w-2xl flex-1 flex-col justify-end gap-4 overflow-hidden px-4 py-4',
        className,
      )}
    >
      {variant === 'chat' ? (
        <>
          <div className="flex items-end gap-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-16 w-56 max-w-[70%] rounded-2xl rounded-bl-sm" />
          </div>
          <div className="flex items-end gap-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-10 w-40 max-w-[60%] rounded-2xl rounded-bl-sm" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-44 max-w-[60%] rounded-2xl rounded-br-sm" />
          </div>
          <div className="flex items-end gap-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-24 w-64 max-w-[75%] rounded-2xl rounded-bl-sm" />
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-end">
            <Skeleton className="h-16 w-64 max-w-[75%] rounded-2xl rounded-br-sm" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-44 max-w-[60%] rounded-2xl rounded-br-sm" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-24 w-72 max-w-[80%] rounded-2xl rounded-br-sm" />
          </div>
        </>
      )}
    </div>
  )
}

export function ComposerDockSkeleton() {
  return (
    <div className="shrink-0 px-3 pb-[max(var(--safe-area-bottom),0.75rem)] pt-2">
      <Skeleton className="mx-auto h-13 max-w-2xl rounded-3xl" />
    </div>
  )
}

// Full fan-room placeholder while the artist (→ header identity, entitlement) is unknown:
// fixed header chrome + feed + composer dock.
export default function RoomSkeleton() {
  return (
    <div className="flex h-full flex-col bg-background">
      <PageHeader
        back={<HeaderBackLink className="lg:hidden" href="/sobok" />}
        title={
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
        }
      />
      <MessageFeedSkeleton />
      <ComposerDockSkeleton />
    </div>
  )
}
