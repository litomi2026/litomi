'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

import IconSpinner from '@/components/icons/IconSpinner'
import IconX from '@/components/icons/IconX'

import type { MangaSearch } from './searchValidation'

import { FILTER_KEYS } from './constants'

type Props = {
  filters: MangaSearch
}

const FILTER_DISPLAY = {
  sort: {
    label: '정렬',
    icon: '↕️',
    values: {
      random: '랜덤',
      id_asc: '오래된 순',
      popular: '인기순',
    },
  },
  view: {
    label: '조회수',
    icon: '👁',
  },
  page: {
    label: '페이지',
    icon: '📄',
  },
  date: {
    label: '날짜',
    icon: '📅',
  },
  skip: {
    label: '건너뛰기',
    icon: '⏭',
  },
  'next-id': {
    label: 'ID 이후',
    icon: '🔢',
  },
} as const

export default function ActiveFilters({ filters }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(key)

    startTransition(() => {
      router.replace(`/search?${params}`)
    })
  }

  const removeRangeFilter = (minKey: string, maxKey: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(minKey)
    params.delete(maxKey)

    startTransition(() => {
      router.replace(`/search?${params}`)
    })
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    const filterKeys = [...FILTER_KEYS, 'next-id', 'skip']

    filterKeys.forEach((key) => {
      params.delete(key)
    })

    startTransition(() => {
      router.replace(`/search?${params}`)
    })
  }

  const formatDate = (timestamp: number | string) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatNumber = (num: number | string | undefined, defaultValue: string) => {
    if (!num) return defaultValue
    return Number(num).toLocaleString('ko-KR')
  }

  return (
    <div className="gap-2 mb-4 hidden sm:grid">
      {/* Header with clear all button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400">적용된 필터</h3>
        <button
          className="text-xs text-zinc-500 hover:text-zinc-300 transition disabled:opacity-50"
          disabled={isPending}
          onClick={clearAllFilters}
          type="button"
        >
          {isPending ? <IconSpinner className="w-3" /> : '모두 지우기'}
        </button>
      </div>

      {/* Filter tags */}
      <div className="flex flex-wrap gap-2">
        {/* Sort filter */}
        {filters.sort && (
          <div className="group flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-full text-sm">
            <span className="text-zinc-500">{FILTER_DISPLAY.sort.icon}</span>
            <span className="text-zinc-300">
              {FILTER_DISPLAY.sort.label}: <strong>{FILTER_DISPLAY.sort.values[filters.sort]}</strong>
            </span>
            <button
              aria-label={`${FILTER_DISPLAY.sort.label} 필터 제거`}
              className="ml-1 p-0.5 rounded-full hover:bg-zinc-700 transition disabled:opacity-50"
              disabled={isPending}
              onClick={() => removeFilter('sort')}
              type="button"
            >
              <IconX className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* View count range */}
        {(filters['min-view'] || filters['max-view']) && (
          <div className="group flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-full text-sm">
            <span className="text-zinc-500">{FILTER_DISPLAY.view.icon}</span>
            <span className="text-zinc-300">
              {FILTER_DISPLAY.view.label}:{' '}
              <strong>
                {formatNumber(filters['min-view'], '0')} ~ {formatNumber(filters['max-view'], '∞')}
              </strong>
            </span>
            <button
              aria-label={`${FILTER_DISPLAY.view.label} 필터 제거`}
              className="ml-1 p-0.5 rounded-full hover:bg-zinc-700 transition disabled:opacity-50"
              disabled={isPending}
              onClick={() => removeRangeFilter('min-view', 'max-view')}
              type="button"
            >
              <IconX className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Page count range */}
        {(filters['min-page'] || filters['max-page']) && (
          <div className="group flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-full text-sm">
            <span className="text-zinc-500">{FILTER_DISPLAY.page.icon}</span>
            <span className="text-zinc-300">
              {FILTER_DISPLAY.page.label}:{' '}
              <strong>
                {formatNumber(filters['min-page'], '1')} ~ {formatNumber(filters['max-page'], '∞')}
              </strong>
            </span>
            <button
              aria-label={`${FILTER_DISPLAY.page.label} 필터 제거`}
              className="ml-1 p-0.5 rounded-full hover:bg-zinc-700 transition disabled:opacity-50"
              disabled={isPending}
              onClick={() => removeRangeFilter('min-page', 'max-page')}
              type="button"
            >
              <IconX className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Date range */}
        {(filters.from || filters.to) && (
          <div className="group flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-full text-sm">
            <span className="text-zinc-500">{FILTER_DISPLAY.date.icon}</span>
            <span className="text-zinc-300">
              {FILTER_DISPLAY.date.label}:{' '}
              <strong>
                {filters.from ? formatDate(filters.from) : '처음'} ~ {filters.to ? formatDate(filters.to) : '오늘'}
              </strong>
            </span>
            <button
              aria-label={`${FILTER_DISPLAY.date.label} 필터 제거`}
              className="ml-1 p-0.5 rounded-full hover:bg-zinc-700 transition disabled:opacity-50"
              disabled={isPending}
              onClick={() => removeRangeFilter('from', 'to')}
              type="button"
            >
              <IconX className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Skip filter */}
        {filters.skip && Number(filters.skip) > 0 && (
          <div className="group flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-full text-sm">
            <span className="text-zinc-500">{FILTER_DISPLAY.skip.icon}</span>
            <span className="text-zinc-300">
              {FILTER_DISPLAY.skip.label}: <strong>{formatNumber(filters.skip, '0')}개</strong>
            </span>
            <button
              aria-label={`${FILTER_DISPLAY.skip.label} 필터 제거`}
              className="ml-1 p-0.5 rounded-full hover:bg-zinc-700 transition disabled:opacity-50"
              disabled={isPending}
              onClick={() => removeFilter('skip')}
              type="button"
            >
              <IconX className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Next ID filter */}
        {filters['next-id'] && (
          <div className="group flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-full text-sm">
            <span className="text-zinc-500">{FILTER_DISPLAY['next-id'].icon}</span>
            <span className="text-zinc-300">
              {FILTER_DISPLAY['next-id'].label}: <strong>{filters['next-id']}</strong>
            </span>
            <button
              aria-label={`${FILTER_DISPLAY['next-id'].label} 필터 제거`}
              className="ml-1 p-0.5 rounded-full hover:bg-zinc-700 transition disabled:opacity-50"
              disabled={isPending}
              onClick={() => removeFilter('next-id')}
              type="button"
            >
              <IconX className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
