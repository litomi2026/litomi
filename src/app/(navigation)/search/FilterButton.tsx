'use client'

import { useSearchParams } from 'next/navigation'
import { lazy, Suspense, useRef, useState } from 'react'

import useMounted from '@/hook/useMounted'

import type { FilterState } from './searchConstants'

import { FilterPanelSkeleton } from './FilterPanel'
import { FILTER_KEYS, isDateFilter } from './searchConstants'

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

  const hasActiveFilters = FILTER_KEYS.some((key) => Boolean(filters[key]))

  return (
    <div className="relative">
      <button
        aria-pressed={hasActiveFilters}
        className="px-3 py-2 h-full text-sm font-medium rounded-xl border-2 transition
          bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500
          aria-pressed:bg-zinc-800 aria-pressed:border-zinc-600 aria-pressed:text-zinc-100
          focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-900"
        onClick={() => setShowFilters(!showFilters)}
        ref={buttonRef}
        type="button"
      >
        필터 {hasActiveFilters && '•'}
      </button>

      {mounted && (
        <Suspense fallback={<FilterPanelSkeleton />}>
          <FilterPanel
            buttonRef={buttonRef}
            filters={filters}
            onClose={() => setShowFilters(false)}
            setFilters={setFilters}
            show={showFilters}
          />
        </Suspense>
      )}
    </div>
  )
}
