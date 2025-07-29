import { PasskeyCardSkeleton } from './PasskeyCard'

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <div className="h-5 w-32 bg-zinc-800 rounded my-1" />
        <div className="h-4 w-40 bg-zinc-800 rounded my-1.5" />
      </div>
      <div className="flex flex-col gap-3">
        <PasskeyCardSkeleton />
        <PasskeyCardSkeleton />
      </div>
    </div>
  )
}
