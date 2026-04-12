import Squircle from '@/components/ui/Squircle'

export default function Loading() {
  return (
    <section aria-live="polite" role="status">
      <span className="sr-only">게시물을 불러오는 중</span>

      <div aria-hidden="true" className="grid gap-4 px-4 py-3 animate-fade-in-fast">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 gap-2">
            <Squircle className="w-10 shrink-0 fill-zinc-700" />
            <div className="grid gap-2 pt-0.5">
              <div className="h-5 w-24 rounded-full bg-zinc-700" />
              <div className="h-4.5 w-16 rounded-full bg-zinc-800" />
            </div>
          </div>
        </div>

        <div className="grid gap-1.5">
          <div className="h-5.5 w-full rounded-full bg-zinc-800" />
          <div className="h-5.5 w-[84%] rounded-full bg-zinc-800" />
          <div className="h-5.5 w-[62%] rounded-full bg-zinc-800" />
        </div>
      </div>
    </section>
  )
}
