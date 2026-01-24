'use client'

import Link from 'next/link'

import type { GETV1PointsDonationsMeRecipient } from '@/backend/api/v1/points/donations/GET'

import { normalizeValue } from '@/translation/common'
import { formatDistanceToNow, formatLocalDate } from '@/utils/format/date'
import { formatNumber } from '@/utils/format/number'
import { ProblemDetailsError } from '@/utils/react-query-error'

import useMyDonationsInfiniteQuery from './useMyDonationsInfiniteQuery'

export default function DonationsClient() {
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMyDonationsInfiniteQuery(true)
  const items = data?.pages.flatMap((p) => p.items) ?? []

  const errorMessage =
    error instanceof ProblemDetailsError
      ? (error.problem.detail ?? error.problem.title)
      : error instanceof Error
        ? error.message
        : null

  return (
    <div className="max-w-3xl w-full mx-auto grid gap-4 sm:p-6">
      <div className="p-3 pb-0 sm:p-0">
        <h1 className="text-xl font-bold tracking-tight">내 기부</h1>
        <p className="mt-1 text-sm text-zinc-500">기부한 기록을 모아서 볼 수 있어요</p>
      </div>

      {isLoading && <p className="text-sm text-zinc-500">불러오는 중...</p>}
      {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}

      {!isLoading && !errorMessage && items.length === 0 && (
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-950/40 p-6 shadow-sm">
          <p className="text-sm text-zinc-400">아직 기부 내역이 없어요</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="rounded-3xl sm:border border-zinc-800/60 bg-zinc-950/40 overflow-hidden shadow-sm">
          <ul className="divide-y divide-zinc-800/60">
            {items.map((item) => {
              const createdAt = new Date(item.createdAt)
              const distanceLabel = formatDistanceToNow(createdAt)
              const dateLabel = formatLocalDate(createdAt)

              return (
                <li className="p-4 sm:p-5 transition hover:bg-zinc-900/40" key={item.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">기부</p>
                      <p className="text-xs text-zinc-500" title={createdAt.toLocaleString()}>
                        {distanceLabel ? `${distanceLabel} · ${dateLabel}` : dateLabel}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-foreground tabular-nums">
                        {formatNumber(item.totalAmount)} 리보
                      </p>
                      <p className="text-xs text-zinc-500">대상 {item.recipients.length}곳</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.recipients.length === 0 ? (
                      <span className="text-sm text-zinc-500">대상 정보가 없어요</span>
                    ) : (
                      item.recipients.map((recipient: GETV1PointsDonationsMeRecipient) => {
                        const recipientLabel = getRecipientDisplayLabel(recipient)
                        const recipientTypeLabel = getRecipientTypeLabel(recipient.type)
                        const recipientQueryValue = getRecipientSearchValue(recipient)
                        const href = recipientQueryValue
                          ? `/search?${new URLSearchParams({ query: recipientQueryValue })}`
                          : '/search'

                        return (
                          <Link
                            className="group inline-flex items-center gap-2 rounded-full border border-zinc-800/60 bg-zinc-900/70 px-3 py-1 text-xs text-zinc-300 transition
                              hover:border-zinc-700 hover:bg-zinc-900/90 hover:text-foreground"
                            href={href}
                            key={`${item.id}-${recipient.type}-${recipient.value}`}
                            prefetch={false}
                            title={`${recipientTypeLabel} ${recipientLabel} 검색`}
                          >
                            <span className="text-[11px] text-zinc-500">{recipientTypeLabel}</span>
                            <span className="max-w-48 truncate">{recipientLabel}</span>
                            <span className="text-[11px] text-brand/80 tabular-nums">
                              {formatNumber(recipient.amount)} 리보
                            </span>
                          </Link>
                        )
                      })
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {items.length > 0 && (
        <div className="flex justify-center">
          <button
            aria-disabled={!hasNextPage || isFetchingNextPage}
            className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 px-4 py-2 text-sm font-semibold text-zinc-200 transition
              hover:border-zinc-700 aria-disabled:opacity-50 aria-disabled:pointer-events-none"
            onClick={() => fetchNextPage()}
            type="button"
          >
            {isFetchingNextPage ? '불러오는 중...' : hasNextPage ? '더 보기' : '마지막이에요'}
          </button>
        </div>
      )}
    </div>
  )
}

function getRecipientDisplayLabel(recipient: { type: 'artist' | 'group'; value: string; label: string }) {
  const trimmedLabel = recipient.label.trim()
  const isGenericLabel = trimmedLabel === (recipient.type === 'artist' ? '작가' : '단체') || trimmedLabel === '그룹'
  if (trimmedLabel && !isGenericLabel) {
    return trimmedLabel
  }

  const normalized = recipient.value.trim().replace(/^(artist:|group:)/, '')
  return normalized ? normalized.replace(/_/g, ' ') : trimmedLabel
}

function getRecipientSearchValue(recipient: { type: 'artist' | 'group'; value: string; label: string }) {
  const rawValue = recipient.value.trim().replace(/^(artist:|group:)/, '')
  const normalizedValue = rawValue ? normalizeValue(rawValue) : normalizeValue(recipient.label)
  return normalizedValue ? `${recipient.type}:${normalizedValue}` : ''
}

function getRecipientTypeLabel(type: 'artist' | 'group') {
  return type === 'artist' ? '작가' : '단체'
}
