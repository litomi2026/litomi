'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Dispatch, FormEvent, RefObject, SetStateAction, useCallback, useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'

import IconSpinner from '@/components/icons/IconSpinner'
import IconX from '@/components/icons/IconX'
import CustomSelect from '@/components/ui/CustomSelect'
import { formatLocalDate } from '@/utils/format/date'

import type { FilterKey, FilterState } from './constants'

import { FILTER_CONFIG, FILTER_KEYS, isDateFilter } from './constants'
import RangeInput from './RangeInput'
import RatingSlider from './RatingSlider'

interface FilterPanelProps {
  buttonRef: RefObject<HTMLButtonElement | null>
  filters: FilterState
  onClose: () => void
  setFilters: Dispatch<SetStateAction<FilterState>>
  show: boolean
}

export default function FilterPanel({ buttonRef, filters, onClose, setFilters, show }: FilterPanelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)
  const isLatestSort = filters.sort === undefined || filters.sort === ''
  const isPopularSort = filters.sort === 'popular'
  const isOldestSort = filters.sort === 'id_asc'

  const handleFilterChange = useCallback(
    (key: FilterKey, value: string) => setFilters((prev) => ({ ...prev, [key]: value })),
    [setFilters],
  )

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      const params = new URLSearchParams(window.location.search)

      FILTER_KEYS.forEach((key) => {
        const value = filters[key]

        if (!value) {
          params.delete(key)
          return
        }

        if (key === 'min-rating' || key === 'max-rating') {
          params.set(key, Math.round(parseFloat(value) * 100).toString())
          return
        }

        if (!isDateFilter(key)) {
          params.set(key, value)
          return
        }

        const date = new Date(value)

        if (key === 'to') {
          date.setHours(23, 59, 59, 999)
        } else {
          date.setHours(0, 0, 0, 0)
        }

        const timestamp = Math.floor(date.getTime() / 1000)
        params.set(key, timestamp.toString())
      })

      // Clean up pagination params
      if (isPopularSort) {
        params.delete('next-id')
      } else if (isLatestSort || isOldestSort) {
        params.delete('next-views')
        params.delete('next-views-id')
      } else {
        params.delete('next-id')
        params.delete('next-views')
        params.delete('next-views-id')
      }

      startTransition(() => {
        router.replace(`${pathname}?${params}`)
        onClose()
      })
    },
    [filters, isLatestSort, isPopularSort, isOldestSort, onClose, pathname, router],
  )

  const clearFilters = useCallback(() => {
    setFilters({})

    const params = new URLSearchParams(window.location.search)
    FILTER_KEYS.forEach((key) => params.delete(key))

    startTransition(() => {
      router.replace(`${pathname}?${params}`)
      onClose()
    })
  }, [pathname, router, setFilters, onClose])

  const filterPanelStyle =
    buttonRect && window.innerWidth >= 640
      ? {
          top: `${buttonRect.bottom + 8}px`,
          right: `${window.innerWidth - buttonRect.right}px`,
        }
      : undefined

  // NOTE: 모바일 환경에서 필터 활성화 시 body 스크롤을 방지함
  useEffect(() => {
    if (!show) {
      return
    }

    const isMobile = window.matchMedia('(max-width: 640px)').matches

    if (!isMobile) {
      return
    }

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [show])

  // NOTE: 화면 크기가 변경될 때 필터 레이아웃을 변경함
  useEffect(() => {
    if (!buttonRef.current) {
      return
    }

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
  }, [buttonRef])

  // NOTE: ESC 키를 눌렀을 때 필터 패널을 닫음
  useEffect(() => {
    if (!show) return

    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscKey)

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [show, onClose])

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        aria-hidden={!show}
        className="fixed inset-0 z-50 bg-background/50 transition hidden opacity-100 sm:block aria-hidden:opacity-0 aria-hidden:pointer-events-none"
        onClick={onClose}
      />

      {/* Filter panel */}
      <form
        aria-hidden={!show}
        className="fixed inset-0 z-50 overflow-y-auto bg-zinc-900 transition-all opacity-100 flex flex-col
          sm:inset-auto sm:w-96 sm:max-w-[calc(100vw-2rem)] sm:max-h-[calc(100vh-8rem)] sm:border-2 sm:border-zinc-700 sm:rounded-xl sm:shadow-xl
          aria-hidden:opacity-0 aria-hidden:pointer-events-none"
        onSubmit={handleSubmit}
        style={filterPanelStyle}
      >
        <div className="sticky top-0 flex items-center justify-between p-4 bg-zinc-900 border-b">
          <h3 className="text-xl font-bold text-zinc-100 sm:text-lg">상세 필터</h3>
          <button
            className="p-2 -mr-2 rounded-lg hover:bg-zinc-800 transition sm:p-1 sm:mr-0"
            onClick={onClose}
            type="button"
          >
            <IconX className="w-6 h-6 sm:w-5 sm:h-5" />
          </button>
        </div>
        <div
          className="p-4 flex flex-col gap-4 flex-1
            [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-zinc-300 [&_label]:mb-1
            [&_input]:text-base [&_input]:px-3 [&_input]:py-2 [&_input]:rounded-lg
            [&_input]:bg-zinc-800 [&_input]:border [&_input]:border-zinc-700 [&_input]:placeholder-zinc-500 
            [&_input]:focus:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-zinc-400 [&_input]:focus:border-transparent [&_input]:invalid:ring-2 [&_input]:invalid:ring-red-500 
            [&_input]:[appearance:textfield] [&_input]:[&::-webkit-outer-spin-button]:appearance-none [&_input]:[&::-webkit-inner-spin-button]:appearance-none"
        >
          {/* Sort */}
          <div>
            <label htmlFor="sort">{FILTER_CONFIG.sort.label}</label>
            <CustomSelect
              id="sort"
              onChange={(value) => handleFilterChange('sort', value)}
              options={FILTER_CONFIG.sort.options}
              value={filters.sort ?? ''}
            />
            {filters.sort === 'random' && (
              <p className="mt-1 text-xs text-zinc-500">랜덤 정렬은 최대 1분 간격으로 결과가 업데이트돼요</p>
            )}
          </div>

          {/* View count range */}
          <RangeInput
            label={FILTER_CONFIG['min-view'].label}
            max={FILTER_CONFIG['max-view'].max}
            maxId="max-view"
            maxValue={filters['max-view'] ?? ''}
            min={FILTER_CONFIG['min-view'].min}
            minId="min-view"
            minPlaceholder="0"
            minValue={filters['min-view'] ?? ''}
            onMaxChange={(value) => handleFilterChange('max-view', value)}
            onMinChange={(value) => handleFilterChange('min-view', value)}
            type="number"
          />

          {/* Page count range */}
          <RangeInput
            label={FILTER_CONFIG['min-page'].label}
            max={FILTER_CONFIG['max-page'].max}
            maxId="max-page"
            maxPlaceholder="10,000"
            maxValue={filters['max-page'] ?? ''}
            min={FILTER_CONFIG['min-page'].min}
            minId="min-page"
            minPlaceholder="1"
            minValue={filters['min-page'] ?? ''}
            onMaxChange={(value) => handleFilterChange('max-page', value)}
            onMinChange={(value) => handleFilterChange('min-page', value)}
            type="number"
          />

          {/* Rating range */}
          <RatingSlider
            maxValue={filters['max-rating']}
            minValue={filters['min-rating']}
            onMaxChange={(value) => handleFilterChange('max-rating', value)}
            onMinChange={(value) => handleFilterChange('min-rating', value)}
          />

          {/* Date range */}
          <RangeInput
            label={FILTER_CONFIG.from.label}
            maxId="to-date"
            maxPlaceholder={FILTER_CONFIG.to.placeholder}
            maxValue={filters.to ?? ''}
            minId="from-date"
            minPlaceholder={FILTER_CONFIG.from.placeholder}
            minValue={filters.from ?? ''}
            onMaxChange={(value) => handleFilterChange('to', value)}
            onMinChange={(value) => handleFilterChange('from', value)}
            type="date"
          />

          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '오늘', days: 0 },
                { label: '어제', days: 1 },
                { label: '최근 7일', days: 7 },
                { label: '최근 30일', days: 30 },
                { label: '최근 3개월', days: 90 },
                { label: '최근 6개월', days: 180 },
                { label: '최근 1년', days: 365 },
                { label: '전체', days: -1 },
              ].map(({ label, days }) => (
                <button
                  className="px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg
                    transition focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  key={label}
                  onClick={() => {
                    if (days === -1) {
                      handleFilterChange('from', '')
                      handleFilterChange('to', '')
                    } else {
                      const to = new Date()
                      const from = new Date()
                      from.setDate(from.getDate() - days)
                      handleFilterChange('from', formatLocalDate(from))
                      handleFilterChange('to', formatLocalDate(to))
                    }
                  }}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Cursor Pagination Fields */}
          {isPopularSort ? (
            <div>
              <label htmlFor="next-views">{FILTER_CONFIG['next-views'].label}</label>
              <input
                className="w-full"
                id="next-views"
                min={FILTER_CONFIG['next-views'].min}
                onChange={(e) => handleFilterChange('next-views', e.target.value)}
                pattern="[0-9]*"
                placeholder={FILTER_CONFIG['next-views'].placeholder}
                type={FILTER_CONFIG['next-views'].type}
                value={filters['next-views'] ?? ''}
              />
              <p className="mt-1 text-xs text-zinc-500">시작 조회수 이하의 작품만 표시해요 (커서 페이지네이션)</p>
            </div>
          ) : (
            <div>
              <label
                aria-disabled={!(isLatestSort || isOldestSort)}
                className="aria-disabled:opacity-50"
                htmlFor="next-id"
              >
                {FILTER_CONFIG['next-id'].label}
              </label>
              <input
                className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!(isLatestSort || isOldestSort)}
                id="next-id"
                min={FILTER_CONFIG['next-id'].min}
                onChange={(e) => handleFilterChange('next-id', e.target.value)}
                pattern="[0-9]*"
                placeholder={FILTER_CONFIG['next-id'].placeholder}
                title={isLatestSort || isOldestSort ? '' : '기본순 또는 오래된순 정렬일 때만 사용할 수 있어요'}
                type={FILTER_CONFIG['next-id'].type}
                value={filters['next-id'] ?? ''}
              />
              <p aria-disabled={!(isLatestSort || isOldestSort)} className="mt-1 text-xs text-zinc-500">
                {isLatestSort || isOldestSort
                  ? '지정한 ID 이후의 결과만 표시해요'
                  : '기본순 또는 오래된순 정렬일 때만 사용할 수 있어요'}
              </p>
            </div>
          )}

          {/* Skip */}
          <div>
            <label htmlFor="skip">{FILTER_CONFIG['skip'].label}</label>
            <input
              className="w-full"
              id="skip"
              min={FILTER_CONFIG['skip'].min}
              onChange={(e) => handleFilterChange('skip', e.target.value)}
              pattern="[0-9]*"
              placeholder={FILTER_CONFIG['skip'].placeholder}
              title="처음 N개의 결과를 건너뛰어요"
              type={FILTER_CONFIG['skip'].type}
              value={filters['skip'] ?? ''}
            />
            <p className="mt-1 text-xs text-zinc-500">처음 N개의 결과를 건너뛰어요</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="sticky bottom-0 left-0 right-0 flex gap-2 bg-zinc-900 px-4 py-4 border-t">
          <button
            className="flex-1 mb-safe px-3 py-2 bg-zinc-800 text-zinc-300 font-medium rounded-lg transition
              disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-zinc-400 hover:bg-zinc-700"
            disabled={isPending}
            onClick={clearFilters}
            type="button"
          >
            초기화
          </button>
          <button
            className="flex items-center justify-center flex-1 mb-safe px-3 py-2 bg-brand text-background font-medium rounded-lg transition
                focus:outline-none focus:ring-2 focus:ring-brand/50 hover:bg-brand/90 disabled:opacity-50"
            disabled={isPending}
            type="submit"
          >
            {isPending ? <IconSpinner className="size-5" /> : '적용'}
          </button>
        </div>
      </form>
    </>,
    document.body,
  )
}
