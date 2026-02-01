'use client'

import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'

import AdultVerificationGate from '@/components/AdultVerificationGate'
import useMeQuery from '@/query/useMeQuery'
import { canAccessAdultRestrictedAPIs } from '@/utils/adult-verification'
import { formatDistanceToNow } from '@/utils/format/date'
import { formatNumber } from '@/utils/format/number'
import { ProblemDetailsError } from '@/utils/react-query-error'

import { useTransactionsQuery } from './useTransactionsQuery'

type TransactionErrorInfo = {
  title: string
  message: string
}

export default function TransactionHistory() {
  const { data: me, isPending: isMePending } = useMeQuery()
  const isLoggedIn = Boolean(me)
  const isAuthReady = !isMePending
  const canAccess = canAccessAdultRestrictedAPIs(me)

  const {
    data,
    error,
    isError,
    isFetching,
    isPending: isTransactionsPending,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    refetch,
  } = useTransactionsQuery({ enabled: isAuthReady && isLoggedIn && canAccess })

  const transactions = data?.pages.flatMap((page) => page.items) ?? []
  const isInitialError = isError && !data
  const isInitialLoading = !isAuthReady || (isLoggedIn && isTransactionsPending)
  const showEmpty = isAuthReady && isLoggedIn && !isInitialLoading && !isInitialError && transactions.length === 0

  return (
    <div className="space-y-3">
      {isAuthReady && !isLoggedIn && (
        <div className="text-center py-8">
          <p className="text-zinc-500">로그인하면 거래 내역을 확인할 수 있어요</p>
        </div>
      )}

      {isAuthReady && isLoggedIn && !canAccess && (
        <AdultVerificationGate
          description="거래 내역을 보려면 익명 성인인증이 필요해요"
          title="성인인증이 필요해요"
          username={me?.name}
        />
      )}

      {isInitialError && (
        <TransactionHistoryErrorBanner
          error={error}
          isRetrying={isFetching}
          onRetry={() => refetch()}
          username={me?.name}
        />
      )}

      <div className="space-y-2">
        {isInitialLoading ? (
          <TransactionHistorySkeleton length={6} />
        ) : showEmpty ? (
          <div className="text-center py-8">
            <p className="text-zinc-500">거래 내역이 없어요</p>
            <p className="text-sm text-zinc-600 mt-1">광고를 클릭해서 리보를 적립해 보세요</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/7" key={tx.id}>
              <div
                className="size-8 rounded-full flex items-center justify-center shrink-0 bg-white/5 border border-white/7 text-zinc-200 data-[type=earn]:text-emerald-400 data-[type=spend]:text-rose-400"
                data-type={tx.type}
              >
                {tx.type === 'earn' ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-300 truncate">
                  {tx.description || (tx.type === 'earn' ? '리보 적립' : '리보 사용')}
                </p>
                <p className="text-xs text-zinc-500" title={new Date(tx.createdAt).toLocaleString()}>
                  {formatDistanceToNow(new Date(tx.createdAt))}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p
                  className="font-medium text-zinc-200 data-[type=earn]:text-emerald-400 data-[type=spend]:text-rose-400"
                  data-type={tx.type}
                >
                  {tx.type === 'earn' ? '+' : ''}
                  {tx.amount.toLocaleString()} 리보
                </p>
                <p className="text-xs text-zinc-500" title={tx.balanceAfter.toLocaleString()}>
                  잔액 {formatNumber(tx.balanceAfter)} 리보
                </p>
              </div>
            </div>
          ))
        )}

        {isFetchingNextPage && <TransactionHistorySkeleton length={2} />}
      </div>

      {isAuthReady && isLoggedIn && !isInitialLoading && !isInitialError && hasNextPage && (
        <div className="space-y-2">
          <button
            className="w-full py-2 text-sm font-medium rounded-xl bg-white/4 border border-white/7 text-zinc-300 hover:bg-white/5 disabled:opacity-60 disabled:cursor-not-allowed transition"
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
            type="button"
          >
            {isFetchingNextPage ? '불러오는 중…' : '더 보기'}
          </button>

          {isFetchNextPageError && (
            <TransactionHistoryNextPageError isRetrying={isFetchingNextPage} onRetry={() => fetchNextPage()} />
          )}
        </div>
      )}
    </div>
  )
}

function getTransactionErrorInfo(error: unknown, username?: string): TransactionErrorInfo {
  if (error instanceof ProblemDetailsError) {
    if (error.status === 401) {
      return {
        title: '로그인이 필요해요',
        message: error.problem.detail ?? '로그인 정보가 없거나 만료됐어요',
      }
    }

    return {
      title: error.problem.detail ?? '거래 내역을 불러오지 못했어요',
      message: '잠시 후 다시 시도해 주세요',
    }
  }

  return {
    title: '거래 내역을 불러오지 못했어요',
    message: '잠시 후 다시 시도해 주세요',
  }
}

function TransactionHistoryErrorBanner({
  error,
  isRetrying,
  onRetry,
  username,
}: {
  error: unknown
  isRetrying: boolean
  onRetry: () => void
  username?: string
}) {
  const info = getTransactionErrorInfo(error, username)
  const showMessage = Boolean(info.message && info.message.trim() !== info.title.trim())

  return (
    <div className="rounded-xl bg-white/4 border border-white/7 p-4">
      <div className="text-center space-y-3">
        <div className="space-y-1">
          <p className="text-zinc-300 font-medium">{info.title}</p>
          {showMessage && <p className="text-sm text-zinc-500">{info.message}</p>}
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            aria-disabled={isRetrying}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-xl bg-white/4 border border-white/7 text-zinc-300 hover:bg-white/5 aria-disabled:opacity-60 aria-disabled:cursor-not-allowed transition"
            disabled={isRetrying}
            onClick={onRetry}
            type="button"
          >
            {isRetrying ? '다시 시도 중…' : '다시 시도'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TransactionHistoryNextPageError({ isRetrying, onRetry }: { isRetrying: boolean; onRetry: () => void }) {
  return (
    <div className="rounded-xl bg-white/3 border border-white/7 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">추가 거래 내역을 불러오지 못했어요</p>
        <button
          aria-disabled={isRetrying}
          className="text-xs font-medium text-zinc-300 hover:text-zinc-100 aria-disabled:opacity-60 aria-disabled:cursor-not-allowed transition"
          disabled={isRetrying}
          onClick={onRetry}
          type="button"
        >
          {isRetrying ? '다시 시도 중…' : '다시 시도해요'}
        </button>
      </div>
    </div>
  )
}

function TransactionHistorySkeleton({ length }: { length: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length }).map((_, index) => (
        <div
          className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/7 animate-pulse"
          key={index}
        >
          <div className="size-8 rounded-full shrink-0 bg-white/7 border border-white/10" />

          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 w-40 max-w-[70%] rounded bg-white/7" />
            <div className="h-3 w-24 max-w-[50%] rounded bg-white/6" />
          </div>

          <div className="shrink-0 text-right space-y-2">
            <div className="h-4 w-20 rounded bg-white/7" />
            <div className="h-3 w-16 rounded bg-white/6" />
          </div>
        </div>
      ))}
    </div>
  )
}
