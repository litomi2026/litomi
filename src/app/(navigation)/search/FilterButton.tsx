'use client'

import { useSearchParams } from 'next/navigation'
import { lazy, Suspense, useCallback, useRef, useState } from 'react'

import useMounted from '@/hook/useMounted'

import type { FilterState } from './constants'

import { FILTER_KEYS, isDateFilter } from './constants'
import { FilterPanelSkeleton } from './FilterPanel'

// NOTE: 필터 패널은 사용자가 필터를 클릭할 때만 표시되므로 초기 bundle 크기를 줄이기 위해 lazy import 사용
const FilterPanel = lazy(() => import('./FilterPanel'))

export default function FilterButton() {
  const searchParams = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const mounted = useMounted()
  const buttonRef = useRef<HTMLButtonElement>(null)

  const [filters, setFilters] = useState<FilterState>(() => {
    const initialState: FilterState = {}

    FILTER_KEYS.forEach((key) => {
      const value = searchParams.get(key)
      if (!value) return

      if (isDateFilter(key)) {
        initialState[key] = new Date(Number(value) * 1000).toISOString().split('T')[0]
      } else {
        initialState[key] = value
      }
    })

    return initialState
  })

  const handleClose = useCallback(() => {
    setShowFilters(false)
  }, [])

  const hasActiveFilters = FILTER_KEYS.some((key) => Boolean(filters[key]))
  const activeFilterCount = FILTER_KEYS.filter((key) => Boolean(filters[key])).length

  return (
    <div className="relative">
      <button
        aria-pressed={hasActiveFilters}
        className="relative px-3 py-2 h-full text-sm font-medium rounded-xl border-2 transition-all
          bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500
          focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-900
          aria-pressed:bg-zinc-800 aria-pressed:border-brand-end/70 aria-pressed:text-zinc-100 aria-pressed:hover:border-brand-end"
        onClick={() => setShowFilters(!showFilters)}
        ref={buttonRef}
        type="button"
      >
        필터
        {hasActiveFilters && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[11px] font-bold bg-brand-end text-background rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {mounted && (
        <Suspense fallback={<FilterPanelSkeleton />}>
          <FilterPanel
            buttonRef={buttonRef}
            filters={filters}
            onClose={handleClose}
            setFilters={setFilters}
            show={showFilters}
          />
        </Suspense>
      )}
    </div>
  )
}
