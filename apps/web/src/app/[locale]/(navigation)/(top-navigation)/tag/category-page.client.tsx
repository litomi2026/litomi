'use client'

import { formatNumber } from '@litomi/std'
import { Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'

import PageNavigation from '@/components/PageNavigation'
import { Link } from '@/i18n/navigation'

import { type CategoryParam, TAG_CATEGORY_PARAMS } from './categories'
import { useTagQuery } from './hook'

type TagCategoryPageClientProps = {
  category: CategoryParam
}

const TAG_COLORS: Record<CategoryParam, string> = {
  female: 'bg-red-900/50 hover:bg-red-800/70',
  male: 'bg-blue-900/50 hover:bg-blue-800/70',
  mixed: 'bg-purple-900/50 hover:bg-purple-800/70',
  other: 'bg-zinc-800/50 hover:bg-zinc-700/70',
}

const TAB_COLORS: Record<CategoryParam, string> = {
  female: 'aria-current:text-red-400 aria-current:border-red-400',
  male: 'aria-current:text-blue-400 aria-current:border-blue-400',
  mixed: 'aria-current:text-purple-400 aria-current:border-purple-400',
  other: 'aria-current:text-zinc-300 aria-current:border-zinc-400',
}

export default function TagCategoryPageClient({ category }: TagCategoryPageClientProps) {
  const locale = useLocale()
  const t = useTranslations('Tag')
  const searchParams = useSearchParams()
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const { data, isLoading, isError, isFetching } = useTagQuery({ category, page })

  const rangeStart = data ? (data.pagination.total === 0 ? 0 : (page - 1) * data.pagination.limit + 1) : 0
  const rangeEnd = data ? Math.min(page * data.pagination.limit, data.pagination.total) : 0

  return (
    <>
      <nav aria-label={t('categories.label')} className="flex justify-center gap-1">
        {TAG_CATEGORY_PARAMS.map((cat) => (
          <Link
            aria-current={cat === category ? 'page' : undefined}
            className={`border-b-2 border-transparent px-5 py-2.5 text-sm font-medium text-zinc-400 transition hover:text-zinc-200 ${TAB_COLORS[cat]}`}
            href={`/tag/${cat}`}
            key={cat}
          >
            {t(`categories.${cat}`)}
          </Link>
        ))}
      </nav>

      {data && (
        <p className="text-center text-sm tabular-nums text-zinc-400">
          {t('pagination.range', {
            end: formatNumber(rangeEnd, locale),
            start: formatNumber(rangeStart, locale),
            total: formatNumber(data.pagination.total, locale),
          })}
        </p>
      )}

      {isLoading && !data && (
        <div className="flex items-center justify-center py-20">
          <Loader2 aria-label={t('loading')} className="size-8 animate-spin text-zinc-400" />
        </div>
      )}

      {isError && !data && <div className="flex items-center justify-center py-20 text-zinc-400">{t('error')}</div>}

      {data && (
        <ul
          aria-busy={isFetching}
          className="flex flex-wrap justify-center gap-2 transition-opacity aria-busy:opacity-50"
        >
          {data.tags.map(({ value, label, count }) => (
            <li key={value}>
              <Link
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${TAG_COLORS[category]}`}
                href={`/search?query=${encodeURIComponent(value)}`}
                prefetch={false}
                title={value}
              >
                <span>{label.split(':')[1] || label}</span>
                <span className="tabular-nums text-xs opacity-60">{formatNumber(count, locale)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {data && (
        <PageNavigation
          className="mt-auto py-4"
          currentPage={page}
          hrefPrefix={`/tag/${category}?page=`}
          totalPages={data.pagination.totalPages}
        />
      )}
    </>
  )
}
