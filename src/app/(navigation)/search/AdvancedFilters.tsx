'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useCallback, useState, useTransition } from 'react'

import IconX from '@/components/icons/IconX'

import RangeInput from './RangeInput'

type FilterState = {
  'min-view'?: string
  'max-view'?: string
  'min-page'?: string
  'max-page'?: string
  from?: string
  until?: string
  sort?: string
}

export default function AdvancedFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState<FilterState>(() => {
    const fromParam = searchParams.get('from')
    const untilParam = searchParams.get('until')

    return {
      'min-view': searchParams.get('min-view') || '',
      'max-view': searchParams.get('max-view') || '',
      'min-page': searchParams.get('min-page') || '',
      'max-page': searchParams.get('max-page') || '',
      from: fromParam ? new Date(Number(fromParam)).toISOString().split('T')[0] : '',
      until: untilParam ? new Date(Number(untilParam)).toISOString().split('T')[0] : '',
      sort: searchParams.get('sort') || '',
    }
  })

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      const params = new URLSearchParams(searchParams.toString())

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          if (key === 'from' || key === 'until') {
            const timestamp = new Date(value).getTime()
            params.set(key, timestamp.toString())
          } else {
            params.set(key, value)
          }
        } else {
          params.delete(key)
        }
      })

      startTransition(() => {
        router.replace(`${pathname}?${params}`, { scroll: false })
        setShowFilters(false)
      })
    },
    [filters, pathname, router, searchParams],
  )

  const clearFilters = useCallback(() => {
    setFilters({
      'min-view': '',
      'max-view': '',
      'min-page': '',
      'max-page': '',
      from: '',
      until: '',
      sort: '',
    })

    const params = new URLSearchParams(searchParams.toString())
    const filterKeys = ['min-view', 'max-view', 'min-page', 'max-page', 'from', 'until', 'sort']
    filterKeys.forEach((key) => params.delete(key))

    startTransition(() => {
      router.replace(`${pathname}?${params}`, { scroll: false })
    })
  }, [pathname, router, searchParams])

  const hasActiveFilters = Object.values(filters).some((value) => value)

  return (
    <div className="relative">
      <button
        className={`px-3 py-2 h-full text-sm font-medium rounded-xl border-2 transition-all
          ${
            hasActiveFilters
              ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
              : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
          }
          focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-900
        `}
        onClick={() => setShowFilters(!showFilters)}
        type="button"
      >
        필터 {hasActiveFilters && '•'}
      </button>

      {showFilters && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setShowFilters(false)} />

          {/* Filter panel */}
          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-96 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] overflow-y-auto bg-zinc-900 border-2 border-zinc-700 rounded-xl shadow-xl">
            <div className="sticky top-0 flex items-center justify-between p-4 pb-0 bg-zinc-900">
              <h3 className="text-lg font-bold text-zinc-100">상세 필터</h3>
              <button
                className="p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                onClick={() => setShowFilters(false)}
                type="button"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <form className="p-4 space-y-4" onSubmit={handleSubmit}>
              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1" htmlFor="sort">
                  정렬
                </label>
                <select
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100
                    focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-transparent appearance-none"
                  id="sort"
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  value={filters.sort}
                >
                  <option value="">기본</option>
                  <option value="random">랜덤</option>
                  <option value="id_asc">오래된 순</option>
                  <option value="popular">인기순</option>
                </select>
              </div>

              {/* View count range */}
              <RangeInput
                label="조회수 범위"
                max={Number.MAX_SAFE_INTEGER}
                maxId="max-view"
                maxValue={filters['max-view'] || ''}
                min={0}
                minId="min-view"
                minValue={filters['min-view'] || ''}
                onMaxChange={(value) => handleFilterChange('max-view', value)}
                onMinChange={(value) => handleFilterChange('min-view', value)}
                type="number"
              />

              {/* Page count range */}
              <RangeInput
                label="페이지 수 범위"
                max={10000}
                maxId="max-page"
                maxValue={filters['max-page'] || ''}
                min={1}
                minId="min-page"
                minValue={filters['min-page'] || ''}
                onMaxChange={(value) => handleFilterChange('max-page', value)}
                onMinChange={(value) => handleFilterChange('min-page', value)}
                type="number"
              />

              {/* Date range */}
              <RangeInput
                label="날짜 범위"
                maxId="until-date"
                maxPlaceholder="종료일"
                maxValue={filters.until || ''}
                minId="from-date"
                minPlaceholder="시작일"
                minValue={filters.from || ''}
                onMaxChange={(value) => handleFilterChange('until', value)}
                onMinChange={(value) => handleFilterChange('from', value)}
                type="date"
              />

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg
                    transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  onClick={clearFilters}
                  type="button"
                >
                  초기화
                </button>
                <button
                  className="flex-1 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-medium rounded-lg
                    transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400
                    disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isPending}
                  type="submit"
                >
                  {isPending ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          fill="none"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                  ) : (
                    '적용'
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
