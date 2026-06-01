'use client'

import type { RefObject, SubmitEvent } from 'react'

import { formatLocalDate } from '@litomi/std'
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '@litomi/ui'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLayoutEffect, useState, useTransition } from 'react'
import { twMerge } from 'tailwind-merge'

import CustomSelect from '@/components/ui/CustomSelect'
import { usePathname, useRouter } from '@/i18n/navigation'

import type { FilterKey, FilterState, SearchSortParamValue } from './constants'

import {
  DEFAULT_SEARCH_SORT,
  FILTER_CONFIG,
  FILTER_PARAM_KEYS,
  isDateFilter,
  SearchParam,
  SearchSort,
} from './constants'
import RangeInput from './RangeInput'
import RatingSlider from './RatingSlider'
import { getLanguageFilter, removeLanguageFilter, setLanguageFilter } from './searchLanguage'
import useSearchLanguageOptions from './useSearchLanguageOptions'

interface FilterPanelProps {
  buttonRef: RefObject<HTMLButtonElement | null>
  onAfterClose: () => void
  onClose: () => void
  show: boolean
}

export default function FilterPanel({ buttonRef, onAfterClose, onClose, show }: FilterPanelProps) {
  const [filters, setFilters] = useState(readInitialFilterState)
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)
  const [searchLanguage, setSearchLanguage] = useState(readInitialSearchLanguage)
  const fetchedLanguageOptions = useSearchLanguageOptions()
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('Search.filter')
  const pathname = usePathname()
  const router = useRouter()

  const sort = filters[SearchParam.SORT]
  const isLatestSort = sort === undefined || sort === DEFAULT_SEARCH_SORT
  const isPopularSort = sort === SearchSort.POPULAR
  const isOldestSort = sort === SearchSort.OLDEST

  const languageOptions = [{ value: '', label: t('languageAll') }, ...fetchedLanguageOptions]

  const sortOptions: { label: string; value: SearchSortParamValue }[] = [
    { value: DEFAULT_SEARCH_SORT, label: t('sortOptions.latest') },
    { value: SearchSort.POPULAR, label: t('sortOptions.popular') },
    { value: SearchSort.RANDOM, label: t('sortOptions.random') },
    { value: SearchSort.OLDEST, label: t('sortOptions.oldest') },
  ]

  const datePresets = [
    { label: t('datePresets.today'), days: 0 },
    { label: t('datePresets.yesterday'), days: 1 },
    { label: t('datePresets.last7Days'), days: 7 },
    { label: t('datePresets.last30Days'), days: 30 },
    { label: t('datePresets.last3Months'), days: 90 },
    { label: t('datePresets.last6Months'), days: 180 },
    { label: t('datePresets.last1Year'), days: 365 },
    { label: t('datePresets.all'), days: -1 },
  ]

  function handleFilterChange(key: FilterKey, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    const params = new URLSearchParams(window.location.search)
    const query = setLanguageFilter(params.get(SearchParam.QUERY), searchLanguage)

    if (query) {
      params.set(SearchParam.QUERY, query)
    } else {
      params.delete(SearchParam.QUERY)
    }

    FILTER_PARAM_KEYS.forEach((key) => {
      const value = filters[key]

      if (!value) {
        params.delete(key)
        return
      }

      if (key === SearchParam.MIN_RATING || key === SearchParam.MAX_RATING) {
        params.set(key, Math.round(parseFloat(value) * 100).toString())
        return
      }

      if (!isDateFilter(key)) {
        params.set(key, value)
        return
      }

      const date = new Date(value)

      if (key === SearchParam.TO) {
        date.setHours(23, 59, 59, 999)
      } else {
        date.setHours(0, 0, 0, 0)
      }

      const timestamp = Math.floor(date.getTime() / 1000)
      params.set(key, timestamp.toString())
    })

    // Clean up pagination params
    if (isPopularSort) {
      params.delete(SearchParam.NEXT_ID)
    } else if (isLatestSort || isOldestSort) {
      params.delete(SearchParam.NEXT_VIEWS)
      params.delete(SearchParam.NEXT_VIEWS_ID)
    } else {
      params.delete(SearchParam.NEXT_ID)
      params.delete(SearchParam.NEXT_VIEWS)
      params.delete(SearchParam.NEXT_VIEWS_ID)
    }

    startTransition(() => {
      router.replace(`${pathname}?${params}`)
      onClose()
    })
  }

  function clearFilters() {
    setFilters({})
    setSearchLanguage('')

    const params = new URLSearchParams(window.location.search)
    const query = removeLanguageFilter(params.get(SearchParam.QUERY))

    if (query) {
      params.set(SearchParam.QUERY, query)
    } else {
      params.delete(SearchParam.QUERY)
    }

    FILTER_PARAM_KEYS.forEach((key) => params.delete(key))

    startTransition(() => {
      router.replace(`${pathname}?${params}`)
      onClose()
    })
  }

  const filterPanelStyle =
    buttonRect && window.innerWidth >= 640
      ? {
          top: `${buttonRect.bottom + 8}px`,
          right: `${window.innerWidth - buttonRect.right}px`,
        }
      : undefined

  // NOTE: 화면 크기가 변경될 때 컴포넌트 레이아웃 위치도 같이 변경해요
  useLayoutEffect(() => {
    function updateButtonRect() {
      if (buttonRef.current) {
        setButtonRect(buttonRef.current.getBoundingClientRect())
      }
    }

    let timeoutId: ReturnType<typeof setTimeout>

    function handleResize() {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateButtonRect, 300)
    }

    updateButtonRect()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, [buttonRef])

  return (
    <Dialog
      ariaLabel={t('title')}
      className="sm:fixed sm:inset-auto sm:w-96 sm:max-w-[calc(100vw-2rem)] sm:max-h-[calc(100dvh-8rem)] sm:border-zinc-700 sm:shadow-xl"
      onAfterClose={onAfterClose}
      onClose={onClose}
      open={show}
      style={filterPanelStyle}
    >
      <form className="flex flex-1 flex-col min-h-0" onSubmit={handleSubmit}>
        <DialogHeader
          closeButtonClassName="sm:p-1"
          closeButtonLabel={t('close')}
          onClose={onClose}
          title={t('title')}
          titleClassName="sm:text-lg"
        />
        <DialogBody
          className={twMerge(
            'flex flex-col gap-4',
            '[&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-zinc-300 [&_label]:mb-1',
            '[&_input]:px-3 [&_input]:py-2 [&_input]:rounded-lg',
            '[&_input]:bg-zinc-800 [&_input]:border [&_input]:border-zinc-700 [&_input]:placeholder-zinc-500',
            '[&_input]:focus:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-zinc-400 [&_input]:focus:border-transparent [&_input]:invalid:ring-2 [&_input]:invalid:ring-red-500',
            '[&_input]:[appearance:textfield] [&_input]:[&::-webkit-outer-spin-button]:appearance-none [&_input]:[&::-webkit-inner-spin-button]:appearance-none',
          )}
        >
          {/* Sort */}
          <div>
            <label htmlFor={SearchParam.SORT}>{t('labels.sort')}</label>
            <CustomSelect
              id={SearchParam.SORT}
              onChange={(value) => handleFilterChange(SearchParam.SORT, value)}
              options={sortOptions}
              value={filters[SearchParam.SORT] ?? DEFAULT_SEARCH_SORT}
            />
            {sort === SearchSort.RANDOM && <p className="mt-1 text-xs text-zinc-500">{t('randomSortNotice')}</p>}
          </div>

          {/* Language */}
          <div>
            <label htmlFor="language">{t('labels.language')}</label>
            <CustomSelect id="language" onChange={setSearchLanguage} options={languageOptions} value={searchLanguage} />
          </div>

          {/* View count range */}
          <RangeInput
            label={t('labels.view')}
            max={FILTER_CONFIG[SearchParam.MAX_VIEW].max}
            maxId={SearchParam.MAX_VIEW}
            maxPlaceholder={t('maxPlaceholder')}
            maxValue={filters[SearchParam.MAX_VIEW] ?? ''}
            min={FILTER_CONFIG[SearchParam.MIN_VIEW].min}
            minId={SearchParam.MIN_VIEW}
            minPlaceholder="0"
            minValue={filters[SearchParam.MIN_VIEW] ?? ''}
            onMaxChange={(value) => handleFilterChange(SearchParam.MAX_VIEW, value)}
            onMinChange={(value) => handleFilterChange(SearchParam.MIN_VIEW, value)}
            type="number"
          />

          {/* Page count range */}
          <RangeInput
            label={t('labels.page')}
            max={FILTER_CONFIG[SearchParam.MAX_PAGE].max}
            maxId={SearchParam.MAX_PAGE}
            maxPlaceholder="10,000"
            maxValue={filters[SearchParam.MAX_PAGE] ?? ''}
            min={FILTER_CONFIG[SearchParam.MIN_PAGE].min}
            minId={SearchParam.MIN_PAGE}
            minPlaceholder="1"
            minValue={filters[SearchParam.MIN_PAGE] ?? ''}
            onMaxChange={(value) => handleFilterChange(SearchParam.MAX_PAGE, value)}
            onMinChange={(value) => handleFilterChange(SearchParam.MIN_PAGE, value)}
            type="number"
          />

          {/* Rating range */}
          <RatingSlider
            maxValue={filters[SearchParam.MAX_RATING]}
            minValue={filters[SearchParam.MIN_RATING]}
            onMaxChange={(value) => handleFilterChange(SearchParam.MAX_RATING, value)}
            onMinChange={(value) => handleFilterChange(SearchParam.MIN_RATING, value)}
          />

          {/* Date range */}
          <RangeInput
            label={t('labels.date')}
            maxId="to-date"
            maxPlaceholder={t('placeholders.dateTo')}
            maxValue={filters[SearchParam.TO] ?? ''}
            minId="from-date"
            minPlaceholder={t('placeholders.dateFrom')}
            minValue={filters[SearchParam.FROM] ?? ''}
            onMaxChange={(value) => handleFilterChange(SearchParam.TO, value)}
            onMinChange={(value) => handleFilterChange(SearchParam.FROM, value)}
            type="date"
          />

          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              {datePresets.map(({ label, days }) => (
                <button
                  className={twMerge(
                    'px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg',
                    'transition focus:outline-none focus:ring-2 focus:ring-zinc-400',
                  )}
                  key={label}
                  onClick={() => {
                    if (days === -1) {
                      handleFilterChange(SearchParam.FROM, '')
                      handleFilterChange(SearchParam.TO, '')
                    } else {
                      const to = new Date()
                      const from = new Date()
                      from.setDate(from.getDate() - days)
                      handleFilterChange(SearchParam.FROM, formatLocalDate(from))
                      handleFilterChange(SearchParam.TO, formatLocalDate(to))
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
              <label htmlFor={SearchParam.NEXT_VIEWS}>{t('labels.nextViews')}</label>
              <input
                className="w-full"
                id={SearchParam.NEXT_VIEWS}
                min={FILTER_CONFIG[SearchParam.NEXT_VIEWS].min}
                onChange={(e) => handleFilterChange(SearchParam.NEXT_VIEWS, e.target.value)}
                pattern="[0-9]*"
                placeholder={t('placeholders.nextViews')}
                type={FILTER_CONFIG[SearchParam.NEXT_VIEWS].type}
                value={filters[SearchParam.NEXT_VIEWS] ?? ''}
              />
              <p className="mt-1 text-xs text-zinc-500">{t('popularCursorNotice')}</p>
            </div>
          ) : (
            <div>
              <label
                aria-disabled={!(isLatestSort || isOldestSort)}
                className="aria-disabled:opacity-50"
                htmlFor={SearchParam.NEXT_ID}
              >
                {t('labels.nextId')}
              </label>
              <input
                className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!(isLatestSort || isOldestSort)}
                id={SearchParam.NEXT_ID}
                inputMode="numeric"
                maxLength={5}
                onChange={(e) => handleFilterChange(SearchParam.NEXT_ID, e.target.value.replace(/\D/g, ''))}
                pattern="[1-9][0-9]*"
                placeholder={t('placeholders.nextId')}
                title={isLatestSort || isOldestSort ? '' : t('idCursorDisabledTitle')}
                type="text"
                value={filters[SearchParam.NEXT_ID] ?? ''}
              />
              <p aria-disabled={!(isLatestSort || isOldestSort)} className="mt-1 text-xs text-zinc-500">
                {isLatestSort || isOldestSort ? t('idCursorNotice') : t('idCursorDisabledNotice')}
              </p>
            </div>
          )}

          {/* Skip */}
          <div>
            <label htmlFor={SearchParam.SKIP}>{t('labels.skip')}</label>
            <input
              className="w-full"
              id={SearchParam.SKIP}
              min={FILTER_CONFIG[SearchParam.SKIP].min}
              onChange={(e) => handleFilterChange(SearchParam.SKIP, e.target.value)}
              pattern="[0-9]*"
              placeholder={t('placeholders.skip')}
              title={t('skipTitle')}
              type={FILTER_CONFIG[SearchParam.SKIP].type}
              value={filters[SearchParam.SKIP] ?? ''}
            />
            <p className="mt-1 text-xs text-zinc-500">{t('skipNotice')}</p>
          </div>
        </DialogBody>

        <DialogFooter className="flex gap-2">
          <button
            className={twMerge(
              'flex-1 px-3 py-2 bg-zinc-800 text-zinc-300 font-medium rounded-lg transition',
              'disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-zinc-400 hover:bg-zinc-700',
            )}
            disabled={isPending}
            onClick={clearFilters}
            type="button"
          >
            {t('reset')}
          </button>
          <button
            className={twMerge(
              'flex items-center justify-center flex-1 px-3 py-2 bg-brand text-background font-medium rounded-lg transition',
              'focus:outline-none focus:ring-2 focus:ring-brand/50 hover:bg-brand/90 active:bg-brand/90 disabled:cursor-wait',
            )}
            disabled={isPending}
            type="submit"
          >
            {isPending ? <Loader2 className="size-5 animate-spin" /> : t('apply')}
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

function readInitialFilterState() {
  const searchParams = new URLSearchParams(window.location.search)
  const filters: FilterState = {}

  FILTER_PARAM_KEYS.forEach((key) => {
    const value = searchParams.get(key)
    if (!value) return

    if (isDateFilter(key)) {
      filters[key] = formatLocalDate(new Date(Number(value) * 1000))
    } else if (key === SearchParam.MIN_RATING || key === SearchParam.MAX_RATING) {
      filters[key] = (Number(value) / 100).toFixed(1)
    } else {
      filters[key] = value
    }
  })

  return filters
}

function readInitialSearchLanguage() {
  return getLanguageFilter(new URLSearchParams(window.location.search).get(SearchParam.QUERY))
}
