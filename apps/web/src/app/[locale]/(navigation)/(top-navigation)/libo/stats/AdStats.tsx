'use client'

import { LOCALE_LANGUAGE_TAGS, Locale } from '@litomi/domain/locale'
import { formatDistanceToNow } from '@litomi/std'
import dayjs from 'dayjs'
import { RefreshCw } from 'lucide-react'
import ms from 'ms'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import LoginGate from '@/components/LoginGate'
import useMeQuery from '@/query/useMeQuery'

import { useAdsterraStatsQuery } from './useAdsterraStatsQuery'

const MAX_RANGE_DAYS = 90
const DEFAULT_RANGE_DAYS = 30
const PRESET_DAYS = [7, DEFAULT_RANGE_DAYS, MAX_RANGE_DAYS]

const formatters = {
  int: new Intl.NumberFormat(LOCALE_LANGUAGE_TAGS[Locale.EN]),
  percent: new Intl.NumberFormat(LOCALE_LANGUAGE_TAGS[Locale.EN], {
    maximumFractionDigits: 2,
  }),
  moneyUsd: new Intl.NumberFormat(LOCALE_LANGUAGE_TAGS[Locale.EN], {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }),
  decimal3: new Intl.NumberFormat(LOCALE_LANGUAGE_TAGS[Locale.EN], {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }),
} as const

type AppliedRange = {
  finishDate: string
  startDate: string
}

export default function AdStats() {
  const startDateInputRef = useRef<HTMLInputElement>(null)
  const finishDateInputRef = useRef<HTMLInputElement>(null)
  const locale = useLocale()
  const t = useTranslations('Libo.stats')
  const { data: me } = useMeQuery()
  const isLoggedIn = Boolean(me)

  const initialRange = useMemo<AppliedRange>(() => {
    const finishDate = dayjs().format('YYYY-MM-DD')
    const startDate = dayjs()
      .subtract(DEFAULT_RANGE_DAYS - 1, 'day')
      .format('YYYY-MM-DD')
    return { startDate, finishDate }
  }, [])

  const [appliedRange, setAppliedRange] = useState<AppliedRange>(initialRange)

  const { data, isLoading, isError, isFetching, refetch } = useAdsterraStatsQuery({
    startDate: appliedRange.startDate,
    finishDate: appliedRange.finishDate,
    enabled: isLoggedIn,
  })

  const items = useMemo(() => data?.items ?? [], [data])
  const sortedItems = useMemo(() => [...items].sort((a, b) => b.date.localeCompare(a.date)), [items])

  const summary = useMemo(() => {
    const totalImpressions = items.reduce((sum, item) => sum + item.impression, 0)
    const totalClicks = items.reduce((sum, item) => sum + item.clicks, 0)
    const totalRevenue = items.reduce((sum, item) => sum + item.revenue, 0)
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const cpm = totalImpressions > 0 ? (totalRevenue / totalImpressions) * 1000 : 0

    return {
      cpm,
      ctr,
      totalClicks,
      totalImpressions,
      totalRevenue,
    }
  }, [items])

  const appliedRangeDays = useMemo(
    () => getRangeDaysInclusive(appliedRange.startDate, appliedRange.finishDate),
    [appliedRange.finishDate, appliedRange.startDate],
  )

  function validateRange(startDate: string, finishDate: string): { ok: false; message: string } | { ok: true } {
    if (!startDate || !finishDate) {
      return { ok: false, message: t('errSelectDate') }
    }

    const start = Date.parse(`${startDate}T00:00:00Z`)
    const finish = Date.parse(`${finishDate}T00:00:00Z`)

    if (!Number.isFinite(start) || !Number.isFinite(finish)) {
      return { ok: false, message: t('errInvalidFormat') }
    }

    if (finish < start) {
      return { ok: false, message: t('errStartAfterFinish') }
    }

    const rangeDays = getRangeDaysInclusive(startDate, finishDate)
    if (rangeDays > MAX_RANGE_DAYS) {
      return { ok: false, message: t('errMaxDays', { max: MAX_RANGE_DAYS }) }
    }

    return { ok: true }
  }

  function applyRange(range: AppliedRange) {
    const result = validateRange(range.startDate, range.finishDate)
    if (!result.ok) {
      toast.warning(result.message)
      return
    }
    setAppliedRange(range)
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    const submitter = (e.nativeEvent as SubmitEvent | undefined)?.submitter

    if (submitter instanceof HTMLButtonElement && submitter.name === 'preset-days') {
      const presetDays = Number(submitter.value)
      const finishDate = dayjs().format('YYYY-MM-DD')
      const startDate = dayjs()
        .subtract(presetDays - 1, 'day')
        .format('YYYY-MM-DD')
      applyRange({ startDate, finishDate })
      return
    }

    const formData = new FormData(e.currentTarget)
    const startDate = String(formData.get('start-date') ?? '')
    const finishDate = String(formData.get('finish-date') ?? '')
    applyRange({ startDate, finishDate })
  }

  if (me === undefined) {
    return <div aria-hidden className="py-8" />
  }

  if (me === null) {
    return <LoginGate description={t('loginRequiredDesc')} />
  }

  return (
    <div className="flex flex-col gap-4 p-2">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-100">{t('title')}</h1>
        <p className="text-xs text-zinc-400">{t('subtitle')}</p>
      </header>

      <form
        className="rounded-xl bg-white/4 border border-white/7 p-4 space-y-3"
        key={`${appliedRange.startDate}:${appliedRange.finishDate}`}
        onSubmit={handleSubmit}
      >
        <div className="flex flex-wrap gap-2">
          {PRESET_DAYS.map((days) => (
            <button
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 border border-white/7 text-zinc-300 hover:bg-white/6 transition"
              disabled={isFetching}
              formNoValidate
              key={days}
              name="preset-days"
              type="submit"
              value={days.toString()}
            >
              {t('lastDays', { days })}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end">
          <label className="grid gap-1 text-xs text-zinc-500" htmlFor="start-date">
            {t('startDate')}
            <input
              className="h-10 rounded-lg bg-white/5 border border-white/7 px-3 text-base text-zinc-100"
              defaultValue={appliedRange.startDate}
              id="start-date"
              max={appliedRange.finishDate}
              name="start-date"
              onChange={(e) => {
                const value = e.target.value
                if (finishDateInputRef.current && value) {
                  finishDateInputRef.current.min = value
                }
              }}
              ref={startDateInputRef}
              required
              type="date"
            />
          </label>

          <label className="grid gap-1 text-xs text-zinc-500" htmlFor="finish-date">
            {t('finishDate')}
            <input
              className="h-10 rounded-lg bg-white/5 border border-white/7 px-3 text-base text-zinc-100"
              defaultValue={appliedRange.finishDate}
              id="finish-date"
              min={appliedRange.startDate}
              name="finish-date"
              onChange={(e) => {
                const value = e.target.value
                if (startDateInputRef.current && value) {
                  startDateInputRef.current.max = value
                }
              }}
              ref={finishDateInputRef}
              required
              type="date"
            />
          </label>

          <button
            className="h-10 rounded-lg px-4 text-sm font-semibold text-zinc-950 bg-brand disabled:bg-zinc-800 disabled:text-zinc-400 disabled:cursor-not-allowed transition"
            disabled={isFetching}
            type="submit"
          >
            {t('apply')}
          </button>
        </div>

        <p className="text-xs text-zinc-500">
          {t('currentRange', {
            start: appliedRange.startDate,
            finish: appliedRange.finishDate,
            days: appliedRangeDays,
          })}
        </p>
      </form>

      <div className="rounded-xl bg-white/4 border border-white/7 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-zinc-200">{t('summary')}</p>
          <p className="text-xs text-zinc-500" title={dayjs(data?.dbDateTime).format('YYYY-MM-DD HH:mm')}>
            {data?.dbDateTime
              ? t('updatedAt', { time: formatDistanceToNow(new Date(data.dbDateTime), locale) })
              : isFetching
                ? t('checkingUpdate')
                : ''}
          </p>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-white/5 border border-white/7 p-3">
            <p className="text-xs text-zinc-500">{t('revenue')}</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100 tabular-nums">
              {formatters.moneyUsd.format(summary.totalRevenue)}
            </p>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/7 p-3">
            <p className="text-xs text-zinc-500">{t('impressions')}</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100 tabular-nums">
              {formatters.int.format(summary.totalImpressions)}
            </p>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/7 p-3">
            <p className="text-xs text-zinc-500">{t('clicks')}</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100 tabular-nums">
              {formatters.int.format(summary.totalClicks)}
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-white/5 border border-white/7 p-3">
            <p className="text-xs text-zinc-500">CTR</p>
            <p className="mt-1 text-sm font-semibold text-zinc-100 tabular-nums">
              {formatters.percent.format(summary.ctr)}%
            </p>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/7 p-3">
            <p className="text-xs text-zinc-500">CPM</p>
            <p className="mt-1 text-sm font-semibold text-zinc-100 tabular-nums">
              ${formatters.decimal3.format(summary.cpm)}
            </p>
          </div>
        </div>
      </div>

      {isError && (
        <div className="rounded-xl bg-white/4 border border-white/7 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-300">{t('errorTitle')}</p>
            <button
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-white/5 border border-white/7 text-zinc-300 hover:bg-white/6 transition"
              onClick={() => refetch()}
              type="button"
            >
              <RefreshCw className="size-4" />
              {t('retry')}
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-zinc-400">{t('loading')}</p>
        </div>
      )}

      {!isLoading && !isError && sortedItems.length === 0 && (
        <div className="text-center py-8">
          <p className="text-zinc-500">{t('emptyTitle')}</p>
          <p className="text-sm text-zinc-600 mt-1">{t('emptyDesc')}</p>
        </div>
      )}

      {sortedItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">{t('daily')}</p>
            <p className="text-xs text-zinc-500">
              {t('daysCount', { days: formatters.int.format(sortedItems.length) })}
            </p>
          </div>

          {sortedItems.map((item) => (
            <div className="rounded-xl bg-white/4 border border-white/7 p-4" key={item.date}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{item.date}</p>
                  <p className="text-xs text-zinc-500">
                    {t('impressions')} {formatters.int.format(item.impression)} · {t('clicks')}{' '}
                    {formatters.int.format(item.clicks)}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-zinc-100 tabular-nums">
                    {formatters.moneyUsd.format(item.revenue)}
                  </p>
                  <p className="text-xs text-zinc-500 tabular-nums">
                    CTR {formatters.percent.format(item.ctr)}% · CPM ${formatters.decimal3.format(item.cpm)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function getRangeDaysInclusive(startDate: string, finishDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`).getTime()
  const finish = new Date(`${finishDate}T00:00:00Z`).getTime()
  const dayMs = ms('1 day')
  const diffMs = finish - start
  return Math.floor(diffMs / dayMs) + 1
}
