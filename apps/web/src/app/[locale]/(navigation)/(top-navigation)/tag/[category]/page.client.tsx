'use client'

import { formatNumber } from '@litomi/std'
import { Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

import PageNavigation from '@/components/PageNavigation'
import { Link } from '@/i18n/navigation'

import { type CategoryParam, TAG_CATEGORY_PARAMS } from '../categories'
import { useTagQuery } from '../hook'

type TagCategoryPageClientProps = {
  category: CategoryParam
}

const TAG_SKELETON_WIDTHS = [
  'w-24',
  'w-32',
  'w-20',
  'w-28',
  'w-36',
  'w-24',
  'w-40',
  'w-28',
  'w-20',
  'w-32',
  'w-24',
  'w-36',
] as const

const CATEGORY_TONES: Record<
  CategoryParam,
  {
    chip: string
    dot: string
    skeleton: string
    summary: string
    tab: string
  }
> = {
  female: {
    chip: 'border-rose-400/20 bg-rose-500/10 text-rose-100 hover:border-rose-300/45 hover:bg-rose-500/20',
    dot: 'bg-rose-400 shadow-rose-400/40',
    skeleton: 'bg-rose-400/10',
    summary: 'from-rose-950/30 via-zinc-950/50',
    tab: 'hover:border-rose-400/50 hover:bg-rose-950/20 hover:text-rose-100 aria-[current=page]:border-rose-400/70 aria-[current=page]:bg-rose-950/35 aria-[current=page]:text-rose-100 aria-[current=page]:ring-1 aria-[current=page]:ring-rose-300/20',
  },
  male: {
    chip: 'border-sky-400/20 bg-sky-500/10 text-sky-100 hover:border-sky-300/45 hover:bg-sky-500/20',
    dot: 'bg-sky-400 shadow-sky-400/40',
    skeleton: 'bg-sky-400/10',
    summary: 'from-sky-950/30 via-zinc-950/50',
    tab: 'hover:border-sky-400/50 hover:bg-sky-950/20 hover:text-sky-100 aria-[current=page]:border-sky-400/70 aria-[current=page]:bg-sky-950/35 aria-[current=page]:text-sky-100 aria-[current=page]:ring-1 aria-[current=page]:ring-sky-300/20',
  },
  mixed: {
    chip: 'border-violet-400/20 bg-violet-500/10 text-violet-100 hover:border-violet-300/45 hover:bg-violet-500/20',
    dot: 'bg-violet-400 shadow-violet-400/40',
    skeleton: 'bg-violet-400/10',
    summary: 'from-violet-950/30 via-zinc-950/50',
    tab: 'hover:border-violet-400/50 hover:bg-violet-950/20 hover:text-violet-100 aria-[current=page]:border-violet-400/70 aria-[current=page]:bg-violet-950/35 aria-[current=page]:text-violet-100 aria-[current=page]:ring-1 aria-[current=page]:ring-violet-300/20',
  },
  other: {
    chip: 'border-zinc-600/50 bg-zinc-800/45 text-zinc-100 hover:border-zinc-400/60 hover:bg-zinc-700/60',
    dot: 'bg-zinc-300 shadow-zinc-300/30',
    skeleton: 'bg-zinc-700/40',
    summary: 'from-zinc-800/45 via-zinc-950/50',
    tab: 'hover:border-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-100 aria-[current=page]:border-zinc-400/80 aria-[current=page]:bg-zinc-800/80 aria-[current=page]:text-zinc-100 aria-[current=page]:ring-1 aria-[current=page]:ring-zinc-300/20',
  },
}

export default function TagCategoryPageClient({ category }: TagCategoryPageClientProps) {
  const locale = useLocale()
  const t = useTranslations('Tag')
  const searchParams = useSearchParams()
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const { data, isLoading, isError, isFetching } = useTagQuery({ category, page })

  const rangeStart = data ? (data.pagination.total === 0 ? 0 : (page - 1) * data.pagination.limit + 1) : 0
  const rangeEnd = data ? Math.min(page * data.pagination.limit, data.pagination.total) : 0
  const tone = CATEGORY_TONES[category]

  return (
    <section className="mx-auto flex w-full max-w-6xl grow flex-col gap-4">
      <div className="grid gap-3">
        <nav aria-label={t('categories.label')} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TAG_CATEGORY_PARAMS.map((cat) => (
            <Link
              aria-current={cat === category ? 'page' : undefined}
              className={`group flex min-h-12 items-center justify-between gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/45 px-3 text-sm font-semibold text-zinc-400 transition hover:bg-zinc-900/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${CATEGORY_TONES[cat].tab}`}
              href={`/tag/${cat}`}
              key={cat}
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <span className={`size-2.5 shrink-0 rounded-full shadow-lg ${CATEGORY_TONES[cat].dot}`} />
                <span className="truncate">{t(`categories.${cat}`)}</span>
              </span>
            </Link>
          ))}
        </nav>
        <div
          className={`overflow-hidden rounded-lg border border-zinc-800/80 bg-linear-to-br ${tone.summary} to-zinc-950/40 shadow-lg shadow-black/10`}
        >
          <div className="flex min-h-20 flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <h2 className="text-xl font-bold leading-7 text-foreground">{t(`categories.${category}`)}</h2>
              <p aria-live="polite" className="mt-1 text-sm leading-6 tabular-nums text-zinc-400">
                {data
                  ? t('pagination.range', {
                      end: formatNumber(rangeEnd, locale),
                      start: formatNumber(rangeStart, locale),
                      total: formatNumber(data.pagination.total, locale),
                    })
                  : t('loading')}
              </p>
            </div>

            {isFetching && data && (
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-800/80 bg-background/50 px-3 py-1.5 text-xs font-semibold text-zinc-400">
                <Loader2 aria-hidden className="size-3.5 animate-spin" />
                <span>{t('loading')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {isLoading && !data && <TagCloudSkeleton category={category} label={t('loading')} />}
      {isError && !data && (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-950/45 py-20 text-sm font-medium text-zinc-400">
          {t('error')}
        </div>
      )}
      {data && (
        <div className="p-3 sm:p-4">
          <ul aria-busy={isFetching} className="flex flex-wrap justify-center gap-2 transition aria-busy:opacity-55">
            {data.tags.map(({ value, label, count }) => (
              <li className="max-w-full" key={value}>
                <Link
                  className={`inline-flex h-9 max-w-[calc(100vw-3rem)] items-center gap-2 rounded-full border px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 sm:max-w-80 ${tone.chip}`}
                  href={`/search?query=${encodeURIComponent(value)}`}
                  prefetch={false}
                  title={value}
                >
                  <span className="min-w-0 truncate">{label.split(':')[1] || label}</span>
                  <span className="shrink-0 rounded-full bg-background/35 px-1.5 py-0.5 text-[0.6875rem] tabular-nums text-zinc-300/80 ring-1 ring-inset ring-foreground/5">
                    {formatNumber(count, locale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {data && (
        <PageNavigation
          className="mt-auto pb-4 pt-2"
          currentPage={page}
          hrefPrefix={`/tag/${category}?page=`}
          totalPages={data.pagination.totalPages}
        />
      )}
    </section>
  )
}

function TagCloudSkeleton({ category, label }: { category: CategoryParam; label: string }) {
  return (
    <div aria-label={label} className="p-3 sm:p-4" role="status">
      <div className="flex flex-wrap justify-center gap-2">
        {TAG_SKELETON_WIDTHS.map((width, index) => (
          <span
            className={`h-9 animate-pulse rounded-full border border-zinc-800/70 ${CATEGORY_TONES[category].skeleton} ${width}`}
            key={`${width}-${index}`}
          />
        ))}
      </div>
    </div>
  )
}
