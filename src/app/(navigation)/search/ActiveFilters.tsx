'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import type { GETProxyKSearchRequest } from '@/app/api/proxy/k/search/types'

import IconSpinner from '@/components/icons/IconSpinner'
import IconX from '@/components/icons/IconX'

import { FILTER_KEYS } from './constants'
import { formatDate, formatNumber } from './utils'

type Props = {
  filters: GETProxyKSearchRequest
}

export default function ActiveFilters({ filters }: Readonly<Props>) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

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
      icon: '↕️',
      label: '정렬',
      value: filters.sort && { random: '랜덤', id_asc: '오래된 순', popular: '인기순' }[filters.sort],
      onRemove: () => removeFilter('sort'),
    },
    {
      condition: filters['min-view'] || filters['max-view'],
      icon: '👁',
      label: '조회수',
      value: `${formatNumber(filters['min-view'], '0')} ~ ${formatNumber(filters['max-view'], '∞')}`,
      onRemove: () => removeRangeFilter('min-view', 'max-view'),
    },
    {
      condition: filters['min-page'] || filters['max-page'],
      icon: '📄',
      label: '페이지',
      value: `${formatNumber(filters['min-page'], '1')} ~ ${formatNumber(filters['max-page'], '∞')}`,
      onRemove: () => removeRangeFilter('min-page', 'max-page'),
    },
    {
      condition: filters['min-rating'] || filters['max-rating'],
      icon: '🌟',
      label: '별점',
      value: `${formatNumber(filters['min-rating']! / 100, '0')} ~ ${formatNumber(filters['max-rating']! / 100, '5')}`,
      onRemove: () => removeRangeFilter('min-rating', 'max-rating'),
    },
    {
      condition: filters.from || filters.to,
      icon: '📅',
      label: '날짜',
      value: `${filters.from ? formatDate(filters.from) : '처음'} ~ ${filters.to ? formatDate(filters.to) : '오늘'}`,
      onRemove: () => removeRangeFilter('from', 'to'),
    },
    {
      condition: filters.skip && Number(filters.skip) > 0,
      icon: '⏭',
      label: '건너뛰기',
      value: `${formatNumber(filters.skip, '0')}개`,
      onRemove: () => removeFilter('skip'),
    },
    {
      condition: filters['next-id'],
      icon: '🔢',
      label: '시작 ID',
      value: filters['next-id'],
      onRemove: () => removeFilter('next-id'),
    },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {filterConfigs
        .filter((config) => config.condition)
        .map((config) => (
          <div
            className="group flex items-center gap-1.5 pl-4 bg-zinc-800 border border-zinc-700 rounded-full text-sm"
            key={config.value}
          >
            <span>{config.icon}</span>
            <span className="text-zinc-300">
              <span className="text-zinc-400">{config.label}:</span> <strong>{config.value}</strong>
            </span>
            <button
              className="p-3 rounded-full hover:bg-zinc-700 transition disabled:opacity-50"
              disabled={isPending}
              onClick={config.onRemove}
              title={`${config.label} 필터 제거`}
              type="button"
            >
              <IconX className="w-3" />
            </button>
          </div>
        ))}
    </div>
  )
}

export function ClearAllFilters() {
  const router = useRouter()
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
      className="text-xs text-zinc-500 hover:text-zinc-300 transition disabled:opacity-50"
      disabled={isPending}
      onClick={clearAllFilters}
      type="button"
    >
      {isPending ? <IconSpinner className="w-3" /> : '모두 지우기'}
    </button>
  )
}
