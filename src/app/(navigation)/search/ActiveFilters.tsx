'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

import IconSpinner from '@/components/icons/IconSpinner'
import IconX from '@/components/icons/IconX'

import type { MangaSearch } from './schema'

import { ALL_FILTER_KEYS } from './constants'
import { formatDate, formatNumber } from './utils'

type ActiveFilterProps = {
  icon: string
  label: string
  value?: string
  onRemove: () => void
  isPending: boolean
}

type Props = {
  filters: MangaSearch
}

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

    ALL_FILTER_KEYS.forEach((key) => {
      params.delete(key)
    })

    startTransition(() => {
      router.replace(`/search?${params}`)
    })
  }

  const filterConfigs = [
    {
      condition: filters.sort,
      icon: '↕️',
      label: '정렬',
      getValue: () => filters.sort && { random: '랜덤', id_asc: '오래된 순', popular: '인기순' }[filters.sort],
      onRemove: () => removeFilter('sort'),
    },
    {
      condition: filters['min-view'] || filters['max-view'],
      icon: '👁',
      label: '조회수',
      getValue: () => `${formatNumber(filters['min-view'], '0')} ~ ${formatNumber(filters['max-view'], '∞')}`,
      onRemove: () => removeRangeFilter('min-view', 'max-view'),
    },
    {
      condition: filters['min-page'] || filters['max-page'],
      icon: '📄',
      label: '페이지',
      getValue: () => `${formatNumber(filters['min-page'], '1')} ~ ${formatNumber(filters['max-page'], '∞')}`,
      onRemove: () => removeRangeFilter('min-page', 'max-page'),
    },
    {
      condition: filters.from || filters.to,
      icon: '📅',
      label: '날짜',
      getValue: () =>
        `${filters.from ? formatDate(filters.from) : '처음'} ~ ${filters.to ? formatDate(filters.to) : '오늘'}`,
      onRemove: () => removeRangeFilter('from', 'to'),
    },
    {
      condition: filters.skip && Number(filters.skip) > 0,
      icon: '⏭',
      label: '건너뛰기',
      getValue: () => `${formatNumber(filters.skip!, '0')}개`,
      onRemove: () => removeFilter('skip'),
    },
    {
      condition: filters['next-id'],
      icon: '🔢',
      label: 'ID 이후',
      getValue: () => filters['next-id']!,
      onRemove: () => removeFilter('next-id'),
    },
  ]

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
        {filterConfigs
          .filter((config) => config.condition)
          .map((config) => (
            <ActiveFilter
              icon={config.icon}
              isPending={isPending}
              key={config.label}
              label={config.label}
              onRemove={config.onRemove}
              value={config.getValue()}
            />
          ))}
      </div>
    </div>
  )
}

function ActiveFilter({ icon, label, value, onRemove, isPending }: ActiveFilterProps) {
  return (
    <div className="group flex items-center gap-1.5 pl-4 bg-zinc-800 border border-zinc-700 rounded-full text-sm">
      <span className="text-zinc-500">{icon}</span>
      <span className="text-zinc-300">
        {label}: <strong>{value}</strong>
      </span>
      <button
        aria-label={`${label} 필터 제거`}
        className="p-3 rounded-full hover:bg-zinc-700 transition disabled:opacity-50"
        disabled={isPending}
        onClick={onRemove}
        type="button"
      >
        <IconX className="w-3" />
      </button>
    </div>
  )
}
