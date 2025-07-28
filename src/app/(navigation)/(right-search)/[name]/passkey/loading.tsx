import Loading from '@/components/ui/Loading'

export default function PasskeyLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-zinc-800 rounded animate-pulse" />
          <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
          <div className="h-5 w-12 bg-zinc-800 rounded-full animate-pulse" />
        </div>
      </div>

      <div className="flex justify-center py-8">
        <Loading />
      </div>

      <div className="mt-8 rounded-lg bg-zinc-900 border border-zinc-800 p-4">
        <div className="h-4 w-full bg-zinc-800 rounded animate-pulse" />
      </div>
    </div>
  )
}
