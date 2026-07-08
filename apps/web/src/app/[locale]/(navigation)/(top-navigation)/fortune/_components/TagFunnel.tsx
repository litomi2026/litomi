import { ArrowUpRight, Compass } from 'lucide-react'

import { Link } from '@/i18n/navigation'

import type { FortuneTagRecommendation } from '../_lib/types'

export function TagFunnel({ tags }: { tags: FortuneTagRecommendation[] }) {
  return (
    <section className="rounded-2xl border border-white/8 bg-white/3 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="inline-flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/6 text-zinc-200"
        >
          <Compass className="size-4" />
        </span>
        <div>
          <p className="text-base font-semibold tracking-tight text-zinc-100">오늘의 운세 작품</p>
          <p className="text-xs text-zinc-400">뽑힌 취향에 맞춘 태그예요. 눌러서 바로 감상해봐요.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {tags.map((tag) => (
          <Link
            className="group flex items-center justify-between gap-2 rounded-xl border border-white/8 bg-black/25 px-3 py-2.5 text-sm text-zinc-100 transition hover:border-brand/50 hover:bg-white/6"
            href={tag.href}
            key={`${tag.category}:${tag.tag}`}
            prefetch={false}
          >
            <span className="truncate font-medium">{tag.label}</span>
            <ArrowUpRight className="size-4 shrink-0 text-zinc-500 transition group-hover:text-brand" />
          </Link>
        ))}
      </div>
    </section>
  )
}
