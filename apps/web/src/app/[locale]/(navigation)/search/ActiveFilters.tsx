'use client'

import { Loader2, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { twMerge } from 'tailwind-merge'

import { useRouter } from '@/i18n/navigation'

import { FILTER_KEYS, SearchParam, SearchSort } from './constants'
import { formatDate, formatNumber } from './utils'

type Props = {
  filters: {
    sort: string | null
    minView: string | null
    maxView: string | null
    minPage: string | null
    maxPage: string | null
    minRating: string | null
    maxRating: string | null
    from: string | null
    to: string | null
    nextId: string | null
    skip: string | null
  }
}

export default function ActiveFilters({ filters }: Props) {
  const router = useRouter()
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('Search.activeFilter')
  const sortT = useTranslations('Search.filter.sortOptions')

  const sortLabels: Partial<Record<string, string>> = {
    [SearchSort.RANDOM]: sortT('random'),
    [SearchSort.OLDEST]: sortT('oldest'),
    [SearchSort.POPULAR]: sortT('popular'),
  }

  function removeFilter(key: string) {
    const params = new URLSearchParams(window.location.search)
    params.delete(key)

    startTransition(() => {
      router.replace(`/search?${params}`)
    })
  }

  function removeRangeFilter(minKey: string, maxKey: string) {
    const params = new URLSearchParams(window.location.search)
    params.delete(minKey)
    params.delete(maxKey)

    startTransition(() => {
      router.replace(`/search?${params}`)
    })
  }

  const filterConfigs = [
    {
      condition: filters.sort,
      label: t('sort'),
      value: filters.sort ? sortLabels[filters.sort] : undefined,
      onRemove: () => removeFilter(SearchParam.SORT),
    },
    {
      condition: filters.minView || filters.maxView,
      label: t('view'),
      value: `${formatNumber(filters.minView, '0', locale)} ~ ${formatNumber(filters.maxView, '∞', locale)}`,
      onRemove: () => removeRangeFilter(SearchParam.MIN_VIEW, SearchParam.MAX_VIEW),
    },
    {
      condition: filters.minPage || filters.maxPage,
      label: t('page'),
      value: `${formatNumber(filters.minPage, '1', locale)} ~ ${formatNumber(filters.maxPage, '∞', locale)}`,
      onRemove: () => removeRangeFilter(SearchParam.MIN_PAGE, SearchParam.MAX_PAGE),
    },
    {
      condition: filters.minRating || filters.maxRating,
      label: t('rating'),
      value: `${formatNumber(parseInt(filters.minRating ?? '0', 10) / 100, '0', locale)} ~ ${formatNumber(parseInt(filters.maxRating ?? '0', 10) / 100, '5', locale)}`,
      onRemove: () => removeRangeFilter(SearchParam.MIN_RATING, SearchParam.MAX_RATING),
    },
    {
      condition: filters.from || filters.to,
      label: t('date'),
      value: `${filters.from ? formatDate(filters.from, locale) : t('beginning')} ~ ${filters.to ? formatDate(filters.to, locale) : t('today')}`,
      onRemove: () => removeRangeFilter(SearchParam.FROM, SearchParam.TO),
    },
    {
      condition: filters.skip && Number(filters.skip) > 0,
      label: t('skip'),
      value: t('countSuffix', { count: formatNumber(filters.skip, '0', locale) }),
      onRemove: () => removeFilter(SearchParam.SKIP),
    },
    {
      condition: filters.nextId,
      label: t('nextId'),
      value: filters.nextId,
      onRemove: () => removeFilter(SearchParam.NEXT_ID),
    },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {filterConfigs
        .filter((config) => config.condition)
        .map((config) => (
          <div
            className="relative flex items-center gap-2 pl-3.5 pr-3 py-1.5 transition rounded-full bg-zinc-800/80 border border-zinc-700/60"
            key={config.value}
          >
            <span className="text-[13px] font-medium leading-tight">
              <span className="text-zinc-500">{config.label}</span>
              <span className="text-zinc-400 mx-1.5">·</span>
              <span className="text-zinc-200">{config.value}</span>
            </span>
            <button
              aria-label={t('remove', { label: config.label })}
              className={twMerge(
                'flex items-center justify-center size-7 p-1.5 -m-2 transition',
                'text-zinc-500 hover:text-zinc-300 active:text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed',
              )}
              disabled={isPending}
              onClick={config.onRemove}
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
    </div>
  )
}

export function ClearAllFilters() {
  const router = useRouter()
  const t = useTranslations('Search.activeFilter')
  const [isPending, startTransition] = useTransition()

  function clearAllFilters() {
    const params = new URLSearchParams(window.location.search)

    FILTER_KEYS.forEach((key) => {
      params.delete(key)
    })

    startTransition(() => {
      router.replace(`/search?${params}`)
    })
  }

  return (
    <button
      aria-label={t('removeAll')}
      className={twMerge(
        'flex items-center gap-1.5 p-2 py-1 transition text-xs font-medium text-zinc-500',
        'hover:text-zinc-300 active:text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed',
      )}
      disabled={isPending}
      onClick={clearAllFilters}
      type="button"
    >
      {isPending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          <span>{t('removing')}</span>
        </>
      ) : (
        t('clearAll')
      )}
    </button>
  )
}
