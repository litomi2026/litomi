export default function Loading() {
  return (
    <section aria-live="polite" className="px-4 py-3" role="status">
      <span className="sr-only">답글을 불러오는 중</span>

      <div aria-hidden="true" className="grid gap-4 animate-fade-in-fast">
        {[...Array(3)].map((_, index) => (
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2" key={index}>
            <div className="row-span-2 size-10 rounded-full bg-zinc-800" />
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="grid gap-1 pt-0.5">
                <div className="h-4.5 w-28 rounded-full bg-zinc-800" />
                <div className="h-4 w-24 rounded-full bg-zinc-900" />
              </div>
              <div className="h-4 w-12 rounded-full bg-zinc-900" />
            </div>
            <div className="grid gap-1.5">
              <div className="h-5 w-full rounded-full bg-zinc-900" />
              <div className="h-5 w-[82%] rounded-full bg-zinc-900" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
