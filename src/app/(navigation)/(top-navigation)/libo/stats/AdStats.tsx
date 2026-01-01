'use client'

import dayjs from 'dayjs'
import { ChevronRight, RefreshCw } from 'lucide-react'
import ms from 'ms'
import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import useMeQuery from '@/query/useMeQuery'
import { formatDistanceToNow } from '@/utils/format/date'

import { useAdsterraStatsQuery } from './useAdsterraStatsQuery'

const MAX_RANGE_DAYS = 90
const DEFAULT_RANGE_DAYS = 30
const PRESET_DAYS = [7, DEFAULT_RANGE_DAYS, MAX_RANGE_DAYS]

const formatters = {
  int: new Intl.NumberFormat('en-US'),
  percent: new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }),
  moneyUsd: new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }),
  decimal3: new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }),
} as const

type AppliedRange = {
  finishDate: string
  startDate: string
}

export default function AdStats() {
  const { data: me, isLoading: isMeLoading } = useMeQuery()
  const isLoggedIn = Boolean(me)

  const startDateInputRef = useRef<HTMLInputElement>(null)
  const finishDateInputRef = useRef<HTMLInputElement>(null)

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

  function applyRange(range: AppliedRange) {
    const result = validateRange(range.startDate, range.finishDate)
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    setAppliedRange(range)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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

  if (isMeLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-zinc-400">불러오는 중이에요</p>
      </div>
    )
  }

  if (!me) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl bg-white/4 border border-white/7 p-4">
          <p className="text-zinc-300 font-medium">광고 수익 통계는 로그인한 사용자만 볼 수 있어요</p>
          <p className="text-sm text-zinc-500 mt-1">로그인하면 최근 30일 통계를 확인할 수 있어요</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-100">광고 수익 통계</h1>
        <p className="text-sm text-zinc-400">
          Adsterra에서 제공하는 통계를 보여줘요. 정산 확정 전에는 실제 지급액과 다를 수 있어요.
        </p>
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
              최근 {days}일
            </button>
          ))}
          <Link
            className="ml-auto inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition"
            href="/libo"
            prefetch={false}
          >
            리보로 돌아가기
            <ChevronRight className="size-3 text-zinc-600" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end">
          <label className="grid gap-1 text-xs text-zinc-500" htmlFor="start-date">
            시작 날짜
            <input
              className="h-10 rounded-lg bg-white/5 border border-white/7 px-3 text-sm text-zinc-100"
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
            종료 날짜
            <input
              className="h-10 rounded-lg bg-white/5 border border-white/7 px-3 text-sm text-zinc-100"
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
            적용
          </button>
        </div>

        <p className="text-xs text-zinc-500">
          현재 범위: {appliedRange.startDate} ~ {appliedRange.finishDate} ({appliedRangeDays}일)
        </p>
      </form>

      <div className="rounded-xl bg-white/4 border border-white/7 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-zinc-200">요약</p>
          <p className="text-xs text-zinc-500" title={dayjs(data?.dbDateTime).format('YYYY-MM-DD HH:mm')}>
            {data?.dbDateTime
              ? `업데이트 ${formatDistanceToNow(new Date(data.dbDateTime))}`
              : isFetching
                ? '업데이트 확인 중…'
                : ''}
          </p>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-white/5 border border-white/7 p-3">
            <p className="text-xs text-zinc-500">수익 (USD)</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100 tabular-nums">
              {formatters.moneyUsd.format(summary.totalRevenue)}
            </p>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/7 p-3">
            <p className="text-xs text-zinc-500">노출</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100 tabular-nums">
              {formatters.int.format(summary.totalImpressions)}
            </p>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/7 p-3">
            <p className="text-xs text-zinc-500">클릭</p>
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
            <p className="text-sm text-zinc-300">통계를 불러오지 못했어요</p>
            <button
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-white/5 border border-white/7 text-zinc-300 hover:bg-white/6 transition"
              onClick={() => refetch()}
              type="button"
            >
              <RefreshCw className="size-4" />
              다시 시도
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-zinc-400">불러오는 중이에요</p>
        </div>
      )}

      {!isLoading && !isError && sortedItems.length === 0 && (
        <div className="text-center py-8">
          <p className="text-zinc-500">표시할 데이터가 없어요</p>
          <p className="text-sm text-zinc-600 mt-1">기간을 바꿔서 다시 확인해 보세요</p>
        </div>
      )}

      {sortedItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">일별</p>
            <p className="text-xs text-zinc-500">{formatters.int.format(sortedItems.length)}일</p>
          </div>

          {sortedItems.map((item) => (
            <div className="rounded-xl bg-white/4 border border-white/7 p-4" key={item.date}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{item.date}</p>
                  <p className="text-xs text-zinc-500">
                    노출 {formatters.int.format(item.impression)} · 클릭 {formatters.int.format(item.clicks)}
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

      <div className="text-xs text-zinc-600">
        <p>조회는 내부 기준으로 처리돼요. 값은 참고용이고, 실제 정산 금액과 다를 수 있어요.</p>
      </div>
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

function validateRange(startDate: string, finishDate: string): { ok: false; message: string } | { ok: true } {
  if (!startDate || !finishDate) {
    return { ok: false, message: '날짜를 선택해 주세요' }
  }

  const start = Date.parse(`${startDate}T00:00:00Z`)
  const finish = Date.parse(`${finishDate}T00:00:00Z`)

  if (!Number.isFinite(start) || !Number.isFinite(finish)) {
    return { ok: false, message: '날짜 형식이 올바르지 않아요' }
  }

  if (finish < start) {
    return { ok: false, message: '시작 날짜는 종료 날짜보다 늦을 수 없어요' }
  }

  const rangeDays = getRangeDaysInclusive(startDate, finishDate)
  if (rangeDays > MAX_RANGE_DAYS) {
    return { ok: false, message: `최대 ${MAX_RANGE_DAYS}일까지만 조회할 수 있어요` }
  }

  return { ok: true }
}
