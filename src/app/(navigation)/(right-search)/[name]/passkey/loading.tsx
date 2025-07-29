export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton - static */}
      <div>
        <div className="h-5 w-32 bg-zinc-800 rounded" />
        <div className="h-4 w-40 bg-zinc-800 rounded mt-1.5" />
      </div>

      {/* Card skeletons - static with consistent spacing */}
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 sm:p-5" key={i}>
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-lg bg-zinc-800" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-zinc-800 rounded mb-2" />
                <div className="h-3 w-32 bg-zinc-800 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tip skeleton - static */}
      <div className="mt-8 rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <div className="h-3.5 w-full bg-zinc-800 rounded" />
      </div>
    </div>
  )
}
