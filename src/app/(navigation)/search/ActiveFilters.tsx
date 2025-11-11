'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import IconSpinner from '@/components/icons/IconSpinner'
import IconX from '@/components/icons/IconX'

import { FILTER_KEYS } from './constants'
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
      label: '정렬',
      value: filters.sort && { random: '랜덤', id_asc: '오래된 순', popular: '인기순' }[filters.sort],
      onRemove: () => removeFilter('sort'),
    },
    {
      condition: filters.minView || filters.maxView,
      label: '조회수',
      value: `${formatNumber(filters.minView, '0')} ~ ${formatNumber(filters.maxView, '∞')}`,
      onRemove: () => removeRangeFilter('min-view', 'max-view'),
    },
    {
      condition: filters.minPage || filters.maxPage,
      label: '페이지',
      value: `${formatNumber(filters.minPage, '1')} ~ ${formatNumber(filters.maxPage, '∞')}`,
      onRemove: () => removeRangeFilter('min-page', 'max-page'),
    },
    {
      condition: filters.minRating || filters.maxRating,
      label: '별점',
      value: `${formatNumber(parseInt(filters.minRating ?? '0') / 100, '0')} ~ ${formatNumber(parseInt(filters.maxRating ?? '0') / 100, '5')}`,
      onRemove: () => removeRangeFilter('min-rating', 'max-rating'),
    },
    {
      condition: filters.from || filters.to,
      label: '날짜',
      value: `${filters.from ? formatDate(filters.from) : '처음'} ~ ${filters.to ? formatDate(filters.to) : '오늘'}`,
      onRemove: () => removeRangeFilter('from', 'to'),
    },
    {
      condition: filters.skip && Number(filters.skip) > 0,
      label: '건너뛰기',
      value: `${formatNumber(filters.skip, '0')}개`,
      onRemove: () => removeFilter('skip'),
    },
    {
      condition: filters.nextId,
      label: '시작 ID',
      value: filters.nextId,
      onRemove: () => removeFilter('next-id'),
    },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {filterConfigs
        .filter((config) => config.condition)
        .map((config) => (
          <div
            className="relative flex items-center gap-2 pl-3.5 pr-3 py-1.5 transition rounded-full
            bg-zinc-800/80 border border-zinc-700/60"
            key={config.value}
          >
            <span className="text-[13px] font-medium leading-tight">
              <span className="text-zinc-500">{config.label}</span>
              <span className="text-zinc-400 mx-1.5">·</span>
              <span className="text-zinc-200">{config.value}</span>
            </span>
            <button
              aria-label={`${config.label} 필터 제거`}
              className="flex items-center justify-center size-7 p-1.5 -m-2 transition
              text-zinc-500 hover:text-zinc-300 active:text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isPending}
              onClick={config.onRemove}
              type="button"
            >
              <IconX className="size-3" />
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
      aria-label="모든 필터 제거"
      className="flex items-center gap-1.5 p-2 py-1 transition text-xs font-medium text-zinc-500 
      hover:text-zinc-300 active:text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={isPending}
      onClick={clearAllFilters}
      type="button"
    >
      {isPending ? (
        <>
          <IconSpinner className="size-4" />
          <span>제거 중</span>
        </>
      ) : (
        '모두 지우기'
      )}
    </button>
  )
}
