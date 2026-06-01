'use client'

import type { ReadonlyURLSearchParams } from 'next/navigation'

import { SlidersHorizontal } from 'lucide-react'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import SearchParamsSync from '@/components/router/SearchParamsSync'

import { FILTER_PARAM_KEYS, SearchParam } from './constants'
import { getLanguageFilter } from './searchLanguage'

// NOTE: 필터 패널은 사용자가 필터를 클릭할 때만 표시되므로 초기 bundle 크기를 줄이기 위해 dynamic import 사용
const FilterPanel = dynamic(() => import('./FilterPanel'))

type FilterPanelState = 'closed' | 'closing' | 'open'

export default function FilterButton() {
  const [filterPanelState, setFilterPanelState] = useState<FilterPanelState>('closed')
  const [activeFilterCount, setActiveFilterCount] = useState(0)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const t = useTranslations('Search.filter')
  const hasActiveFilters = activeFilterCount > 0

  function handleSearchParamUpdate(searchParams: ReadonlyURLSearchParams) {
    const hasLanguage = getLanguageFilter(searchParams.get(SearchParam.QUERY))

    const currentFilterCount = FILTER_PARAM_KEYS.reduce(
      (count, key) => count + (searchParams.get(key) ? 1 : 0),
      hasLanguage ? 1 : 0,
    )

    setActiveFilterCount(currentFilterCount)
  }

  return (
    <div className="relative">
      <SearchParamsSync onUpdate={handleSearchParamUpdate} />
      <button
        aria-expanded={filterPanelState === 'open'}
        aria-label={t('title')}
        aria-pressed={hasActiveFilters}
        className={twMerge(
          'relative inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-[1.1rem] border transition',
          'bg-zinc-900/92 border-zinc-700 text-zinc-200 shadow-sm',
          'hover:border-zinc-600 hover:bg-zinc-800/80',
          'focus:outline-none focus:ring-2 focus:ring-zinc-500/30 focus:ring-offset-2 focus:ring-offset-background',
          'aria-pressed:bg-zinc-800 aria-pressed:border-brand/70 aria-pressed:text-foreground aria-pressed:hover:border-brand',
        )}
        onClick={() => setFilterPanelState('open')}
        ref={buttonRef}
        title={t('title')}
        type="button"
      >
        <SlidersHorizontal aria-hidden className="size-4 sm:size-5" />
        <span className="md:hidden lg:inline">{t('button')}</span>
        {hasActiveFilters && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-xs font-bold bg-brand text-background rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>
      {filterPanelState !== 'closed' && (
        <FilterPanel
          buttonRef={buttonRef}
          onAfterClose={() => setFilterPanelState('closed')}
          onClose={() => setFilterPanelState('closing')}
          show={filterPanelState === 'open'}
        />
      )}
    </div>
  )
}
