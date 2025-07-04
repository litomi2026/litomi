'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'

import IconSpinner from '@/components/icons/IconSpinner'
import IconX from '@/components/icons/IconX'
import { useMounted } from '@/hook/useMounted'

import RangeInput from './RangeInput'

type FilterState = {
  sort?: string
  'min-view'?: string
  'max-view'?: string
  'min-page'?: string
  'max-page'?: string
  from?: string
  to?: string
}

const FILTER_KEYS = ['sort', 'min-view', 'max-view', 'min-page', 'max-page', 'from', 'to'] as const

export default function AdvancedFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [showFilters, setShowFilters] = useState(false)
  const mounted = useMounted()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)

  const [filters, setFilters] = useState<FilterState>(() => {
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    return {
      'min-view': searchParams.get('min-view') ?? '',
      'max-view': searchParams.get('max-view') ?? '',
      'min-page': searchParams.get('min-page') ?? '',
      'max-page': searchParams.get('max-page') ?? '',
      from: fromParam ? new Date(Number(fromParam) * 1000).toISOString().split('T')[0] : '',
      to: toParam ? new Date(Number(toParam) * 1000).toISOString().split('T')[0] : '',
      sort: searchParams.get('sort') ?? '',
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
          if (key === 'from' || key === 'to') {
            const date = new Date(value)

            if (key === 'to') {
              date.setHours(23, 59, 59, 999)
              const now = new Date()
              if (date > now) {
                date.setTime(now.getTime())
              }
            }

            const timestamp = Math.floor(date.getTime() / 1000)
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
      to: '',
      sort: '',
    })

    const params = new URLSearchParams(searchParams.toString())
    FILTER_KEYS.forEach((key) => params.delete(key))

    startTransition(() => {
      router.replace(`${pathname}?${params}`, { scroll: false })
    })
  }, [pathname, router, searchParams])

  const hasActiveFilters = Object.values(filters).some((value) => value)

  const filterPanelStyle =
    buttonRect && window.innerWidth >= 640
      ? {
          top: `${buttonRect.bottom + 8}px`,
          right: `${window.innerWidth - buttonRect.right}px`,
        }
      : undefined

  // NOTE: 모바일 환경에서 필터 활성화 시 body 스크롤을 방지함
  useEffect(() => {
    if (!showFilters) return

    const isMobile = window.matchMedia('(max-width: 640px)').matches
    if (!isMobile) return

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [showFilters])

  // NOTE: 화면 크기가 변경될 때 필터 레이아웃을 변경함
  useEffect(() => {
    if (!showFilters || !buttonRef.current) return

    let timeoutId: NodeJS.Timeout
    const handleDebouncedResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        if (buttonRef.current) {
          setButtonRect(buttonRef.current.getBoundingClientRect())
        }
      }, 300)
    }

    handleDebouncedResize()

    window.addEventListener('resize', handleDebouncedResize)

    return () => {
      window.removeEventListener('resize', handleDebouncedResize)
      clearTimeout(timeoutId)
    }
  }, [showFilters])

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
        ref={buttonRef}
        type="button"
      >
        필터 {hasActiveFilters && '•'}
      </button>

      {mounted &&
        showFilters &&
        createPortal(
          <>
            {/* Backdrop - only visible on desktop */}
            <div className="hidden sm:block fixed inset-0 z-50 bg-black/20" onClick={() => setShowFilters(false)} />

            {/* Filter panel */}
            <div
              className="fixed inset-0 z-50 sm:inset-auto sm:w-96 sm:max-w-[calc(100vw-2rem)] sm:max-h-[calc(100vh-8rem)] 
                overflow-y-auto bg-zinc-900 sm:border-2 sm:border-zinc-700 sm:rounded-xl sm:shadow-xl"
              style={filterPanelStyle}
            >
              <div className="sticky top-0 flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 sm:border-b-0 sm:pb-0">
                <h3 className="text-xl font-bold text-zinc-100 sm:text-lg">상세 필터</h3>
                <button
                  className="p-2 -mr-2 rounded-lg hover:bg-zinc-800 transition-colors sm:p-1 sm:mr-0"
                  onClick={() => setShowFilters(false)}
                  type="button"
                >
                  <IconX className="w-6 h-6 sm:w-5 sm:h-5" />
                </button>
              </div>

              <form className="p-4 space-y-4 pb-32 sm:pb-4" onSubmit={handleSubmit}>
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
                  maxValue={filters['max-view'] ?? ''}
                  min={0}
                  minId="min-view"
                  minValue={filters['min-view'] ?? ''}
                  onMaxChange={(value) => handleFilterChange('max-view', value)}
                  onMinChange={(value) => handleFilterChange('min-view', value)}
                  type="number"
                />

                {/* Page count range */}
                <RangeInput
                  label="페이지 수 범위"
                  max={10000}
                  maxId="max-page"
                  maxValue={filters['max-page'] ?? ''}
                  min={1}
                  minId="min-page"
                  minValue={filters['min-page'] ?? ''}
                  onMaxChange={(value) => handleFilterChange('max-page', value)}
                  onMinChange={(value) => handleFilterChange('min-page', value)}
                  type="number"
                />

                {/* Date range */}
                <RangeInput
                  label="날짜 범위"
                  maxId="to-date"
                  maxPlaceholder="종료일"
                  maxValue={filters.to ?? ''}
                  minId="from-date"
                  minPlaceholder="시작일"
                  minValue={filters.from ?? ''}
                  onMaxChange={(value) => handleFilterChange('to', value)}
                  onMinChange={(value) => handleFilterChange('from', value)}
                  type="date"
                />

                {/* Action buttons */}
                <div className="fixed bottom-0 mb-safe left-0 right-0 flex gap-2 bg-zinc-900 px-4 py-4 border-t border-zinc-800 sm:static sm:bg-transparent sm:border-t-0 sm:p-0">
                  <button
                    className="flex-1 px-3 py-3 sm:py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg
                      transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400"
                    onClick={clearFilters}
                    type="button"
                  >
                    초기화
                  </button>
                  <button
                    className="flex items-center justify-center flex-1 px-3 py-3 sm:py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-medium rounded-lg
                      transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400
                      disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isPending}
                    type="submit"
                  >
                    {isPending ? <IconSpinner className="w-5" /> : '적용'}
                  </button>
                </div>
              </form>
            </div>
          </>,
          document.body,
        )}
    </div>
  )
}
