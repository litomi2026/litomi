'use client'

import dynamic from 'next/dynamic'
import { ReadonlyURLSearchParams } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'

import useMounted from '@/hook/useMounted'
import { formatLocalDate } from '@/utils/date'

import type { FilterState } from './constants'

import { FILTER_KEYS, isDateFilter } from './constants'
import UpdateFromSearchParams from './UpdateFromSearchParams'

// NOTE: 필터 패널은 사용자가 필터를 클릭할 때만 표시되므로 초기 bundle 크기를 줄이기 위해 dynamic import 사용
const FilterPanel = dynamic(() => import('./FilterPanel'))

export default function FilterButton() {
  const [showFilters, setShowFilters] = useState(false)
  const mounted = useMounted()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [filters, setFilters] = useState<FilterState>({})
  const hasActiveFilters = FILTER_KEYS.some((key) => Boolean(filters[key]))
  const activeFilterCount = FILTER_KEYS.filter((key) => Boolean(filters[key])).length

  const handleClose = useCallback(() => {
    setShowFilters(false)
  }, [])

  const handleSearchParamUpdate = useCallback((searchParams: ReadonlyURLSearchParams) => {
    const initialState: FilterState = {}

    FILTER_KEYS.forEach((key) => {
      const value = searchParams.get(key)
      if (!value) return

      if (isDateFilter(key)) {
        initialState[key] = formatLocalDate(new Date(Number(value) * 1000))
      } else if (key === 'min-rating' || key === 'max-rating') {
        initialState[key] = (Number(value) / 100).toFixed(1)
      } else {
        initialState[key] = value
      }
    })

    setFilters(initialState)
  }, [])

  return (
    <div className="relative">
      <UpdateFromSearchParams onUpdate={handleSearchParamUpdate} />
      <button
        aria-pressed={hasActiveFilters}
        className="relative px-3 py-2 h-full text-sm font-medium rounded-xl border-2 transition-all
          bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500
          focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-900
          aria-pressed:bg-zinc-800 aria-pressed:border-brand/70 aria-pressed:text-zinc-100 aria-pressed:hover:border-brand"
        onClick={() => setShowFilters(!showFilters)}
        ref={buttonRef}
        type="button"
      >
        필터
        {hasActiveFilters && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[11px] font-bold bg-brand text-background rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>
      {mounted && (
        <FilterPanel
          buttonRef={buttonRef}
          filters={filters}
          onClose={handleClose}
          setFilters={setFilters}
          show={showFilters}
        />
      )}
    </div>
  )
}
