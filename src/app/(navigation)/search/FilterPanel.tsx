'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Dispatch, FormEvent, RefObject, SetStateAction, useCallback, useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'

import IconSpinner from '@/components/icons/IconSpinner'
import IconX from '@/components/icons/IconX'

import type { FilterKey, FilterState } from './constants'

import { FILTER_CONFIG, FILTER_KEYS, isDateFilter } from './constants'
import RangeInput from './RangeInput'

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
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)
  const isDefaultSort = filters.sort === undefined || filters.sort === ''

  const handleFilterChange = useCallback(
    (key: FilterKey, value: string) => setFilters((prev) => ({ ...prev, [key]: value })),
    [setFilters],
  )

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      const params = new URLSearchParams(searchParams)

      FILTER_KEYS.forEach((key) => {
        const value = filters[key]

        if (!value) {
          params.delete(key)
          return
        }

        if (!isDateFilter(key)) {
          params.set(key, value)
          return
        }

        const date = new Date(value)

        if (key === 'to') {
          date.setHours(23, 59, 59, 999)
        }

        const timestamp = Math.floor(date.getTime() / 1000)
        params.set(key, timestamp.toString())
      })

      if (filters.sort !== '' && filters['next-id']) {
        params.delete('next-id')
      }

      startTransition(() => {
        router.replace(`${pathname}?${params}`)
        onClose()
      })
    },
    [filters, onClose, pathname, router, searchParams],
  )

  const clearFilters = useCallback(() => {
    setFilters({})

    const params = new URLSearchParams(searchParams.toString())
    FILTER_KEYS.forEach((key) => params.delete(key))

    startTransition(() => {
      router.replace(`${pathname}?${params}`)
      onClose()
    })
  }, [pathname, router, searchParams, setFilters, onClose])

  const filterPanelStyle =
    buttonRect && window.innerWidth >= 640
      ? {
          top: `${buttonRect.bottom + 8}px`,
          right: `${window.innerWidth - buttonRect.right}px`,
        }
      : undefined

  // NOTE: URL 파라미터가 변경될 때 필터 상태를 동기화함
  useEffect(() => {
    const newFilters: FilterState = {}

    FILTER_KEYS.forEach((key) => {
      const value = searchParams.get(key)
      if (!value) return

      if (!isDateFilter(key)) {
        newFilters[key] = value
        return
      }

      const timestamp = parseInt(value, 10)
      if (isNaN(timestamp)) return

      const date = new Date(timestamp * 1000)
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      newFilters[key] = `${year}-${month}-${day}`
    })

    setFilters(newFilters)
  }, [searchParams, setFilters])

  // NOTE: 모바일 환경에서 필터 활성화 시 body 스크롤을 방지함
  useEffect(() => {
    if (!show) return

    const isMobile = window.matchMedia('(max-width: 640px)').matches
    if (!isMobile) return

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [show])

  // NOTE: 화면 크기가 변경될 때 필터 레이아웃을 변경함
  useEffect(() => {
    if (!buttonRef.current) return

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

    window.addEventListener('keydown', handleEscKey)

    return () => {
      window.removeEventListener('keydown', handleEscKey)
    }
  }, [show, onClose])

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        aria-hidden={!show}
        className="fixed inset-0 z-[60] bg-black/20 transition duration-300 hidden opacity-100 sm:block aria-hidden:opacity-0 aria-hidden:pointer-events-none"
        onClick={onClose}
      />

      {/* Filter panel */}
      <div
        aria-hidden={!show}
        className="fixed inset-0 z-[70] sm:inset-auto sm:w-96 sm:max-w-[calc(100vw-2rem)] sm:max-h-[calc(100vh-8rem)] 
          overflow-y-auto bg-zinc-900 sm:border-2 sm:border-zinc-700 sm:rounded-xl sm:shadow-xl
          transition-all duration-300 opacity-100
          aria-hidden:opacity-0 aria-hidden:pointer-events-none"
        style={filterPanelStyle}
      >
        <div className="sticky top-0 flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 sm:border-b-0 sm:pb-0">
          <h3 className="text-xl font-bold text-zinc-100 sm:text-lg">상세 필터</h3>
          <button
            className="p-2 -mr-2 rounded-lg hover:bg-zinc-800 transition sm:p-1 sm:mr-0"
            onClick={onClose}
            type="button"
          >
            <IconX className="w-6 h-6 sm:w-5 sm:h-5" />
          </button>
        </div>

        <form
          className="p-4 space-y-4 pb-32 sm:pb-4 
            [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-zinc-300 [&_label]:mb-1
            [&_input]:text-base [&_input]:px-3 [&_input]:py-2 [&_input]:rounded-lg
            [&_input]:bg-zinc-800 [&_input]:border [&_input]:border-zinc-700 [&_input]:placeholder-zinc-500 
            [&_input]:focus:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-zinc-400 [&_input]:focus:border-transparent [&_input]:invalid:ring-2 [&_input]:invalid:ring-red-500 
            [&_input]:[appearance:textfield] [&_input]:[&::-webkit-outer-spin-button]:appearance-none [&_input]:[&::-webkit-inner-spin-button]:appearance-none"
          onSubmit={handleSubmit}
        >
          {/* Sort */}
          <div>
            <label htmlFor="sort">{FILTER_CONFIG.sort.label}</label>
            <select
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100
                focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-transparent appearance-none"
              id="sort"
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              value={filters.sort ?? ''}
            >
              {FILTER_CONFIG.sort.options.map((option: { value: string; label: string }) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* View count range */}
          <RangeInput
            label={FILTER_CONFIG['min-view'].label}
            max={FILTER_CONFIG['max-view'].max}
            maxId="max-view"
            maxValue={filters['max-view'] ?? ''}
            min={FILTER_CONFIG['min-view'].min}
            minId="min-view"
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
            maxValue={filters['max-page'] ?? ''}
            min={FILTER_CONFIG['min-page'].min}
            minId="min-page"
            minValue={filters['min-page'] ?? ''}
            onMaxChange={(value) => handleFilterChange('max-page', value)}
            onMinChange={(value) => handleFilterChange('min-page', value)}
            type="number"
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

          {/* Next ID */}
          <div>
            <label aria-disabled={!isDefaultSort} className="aria-disabled:opacity-50" htmlFor="next-id">
              {FILTER_CONFIG['next-id'].label}
            </label>
            <input
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isDefaultSort}
              id="next-id"
              min={FILTER_CONFIG['next-id'].min}
              onChange={(e) => handleFilterChange('next-id', e.target.value)}
              pattern="[0-9]*"
              placeholder={FILTER_CONFIG['next-id'].placeholder}
              title={isDefaultSort ? '' : '기본순 정렬일 때만 사용할 수 있어요.'}
              type={FILTER_CONFIG['next-id'].type}
              value={filters['next-id'] ?? ''}
            />
            <p aria-disabled={!isDefaultSort} className="mt-1 text-xs text-zinc-500">
              {isDefaultSort ? '지정한 ID 이후의 결과만 표시해요.' : '기본순 정렬일 때만 사용할 수 있어요.'}
            </p>
          </div>

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
              title="처음 N개의 결과를 건너뛰어요."
              type={FILTER_CONFIG['skip'].type}
              value={filters['skip'] ?? ''}
            />
            <p className="mt-1 text-xs text-zinc-500">처음 N개의 결과를 건너뛰어요.</p>
          </div>

          {/* Action buttons */}
          <div className="fixed bottom-0 mb-safe left-0 right-0 flex gap-2 bg-zinc-900 px-4 py-4 border-t border-zinc-800 sm:static sm:bg-transparent sm:border-t-0 sm:p-0">
            <button
              className="flex-1 px-3 py-3 sm:py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg
              transition focus:outline-none focus:ring-2 focus:ring-zinc-400"
              onClick={clearFilters}
              type="button"
            >
              초기화
            </button>
            <button
              className="flex items-center justify-center flex-1 px-3 py-3 sm:py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-medium rounded-lg
                transition focus:outline-none focus:ring-2 focus:ring-zinc-400
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
  )
}
