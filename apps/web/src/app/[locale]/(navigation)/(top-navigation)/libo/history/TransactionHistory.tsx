'use client'

import { LOCALE_LANGUAGE_TAGS } from '@litomi/domain/locale'
import { formatDistanceToNow, formatNumber } from '@litomi/std'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import AdultVerificationGate from '@/components/AdultVerificationGate'
import LoginGate from '@/components/LoginGate'
import useMeQuery from '@/query/useMeQuery'
import { hasAdultAccess } from '@/utils/adult-verification'
import { ProblemDetailsError } from '@/utils/fetch-response'

import { useTransactionsQuery } from './useTransactionsQuery'

type TransactionErrorInfo = {
  title: string
  message: string
}

export default function TransactionHistory() {
  const { data: me, isPending: isMePending } = useMeQuery()
  const tNav = useTranslations('Libo.navigation')
  const t = useTranslations('Libo.history')
  const locale = useLocale()

  const isLoggedIn = Boolean(me)
  const isAuthReady = !isMePending
  const canAccess = hasAdultAccess(me)

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

  if (isAuthReady && !isLoggedIn) {
    return <LoginGate description={t('loginPrompt')} />
  }

  if (isAuthReady && isLoggedIn && !canAccess) {
    return <AdultVerificationGate description={t('adultGateDescription')} />
  }

  function getTransactionErrorInfo(error: unknown): TransactionErrorInfo {
    if (error instanceof ProblemDetailsError) {
      if (error.status === 401) {
        return {
          title: t('loginRequiredTitle'),
          message: error.problem.detail ?? t('loginRequiredDesc'),
        }
      }

      return {
        title: error.problem.detail ?? t('errorTitle'),
        message: t('errorDesc'),
      }
    }

    return {
      title: t('errorTitle'),
      message: t('errorDesc'),
    }
  }

  return (
    <div className="space-y-3">
      {isInitialError && (
        <TransactionHistoryErrorBanner
          error={error}
          getErrorInfo={getTransactionErrorInfo}
          isRetrying={isFetching}
          onRetry={() => refetch()}
        />
      )}

      <div className="space-y-2">
        {isInitialLoading ? (
          <TransactionHistorySkeleton length={6} />
        ) : showEmpty ? (
          <div className="text-center py-8">
            <p className="text-zinc-500">{t('emptyTitle')}</p>
            <p className="text-sm text-zinc-600 mt-1">{t('emptyDesc')}</p>
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
                  {tx.description || (tx.type === 'earn' ? t('earned') : t('spent'))}
                </p>
                <p
                  className="text-xs text-zinc-500"
                  title={new Date(tx.createdAt).toLocaleString(LOCALE_LANGUAGE_TAGS[locale])}
                >
                  {formatDistanceToNow(new Date(tx.createdAt), locale)}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p
                  className="font-medium text-zinc-200 data-[type=earn]:text-emerald-400 data-[type=spend]:text-rose-400"
                  data-type={tx.type}
                >
                  {tx.type === 'earn' ? '+' : ''}
                  {tx.amount.toLocaleString(LOCALE_LANGUAGE_TAGS[locale])} {tNav('liboUnit')}
                </p>
                <p
                  className="text-xs text-zinc-500"
                  title={tx.balanceAfter.toLocaleString(LOCALE_LANGUAGE_TAGS[locale])}
                >
                  {t('balance', { balance: formatNumber(tx.balanceAfter, locale) })}
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
            {isFetchingNextPage ? t('loading') : t('loadMore')}
          </button>

          {isFetchNextPageError && (
            <TransactionHistoryNextPageError isRetrying={isFetchingNextPage} onRetry={() => fetchNextPage()} />
          )}
        </div>
      )}
    </div>
  )
}

function TransactionHistoryErrorBanner({
  error,
  isRetrying,
  onRetry,
  getErrorInfo,
}: {
  error: unknown
  isRetrying: boolean
  onRetry: () => void
  getErrorInfo: (err: unknown) => TransactionErrorInfo
}) {
  const t = useTranslations('Libo.history')
  const info = getErrorInfo(error)
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
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-xl bg-white/4 border border-white/7 text-zinc-300 hover:bg-white/5 disabled:opacity-60 disabled:cursor-not-allowed transition"
            disabled={isRetrying}
            onClick={onRetry}
            type="button"
          >
            {isRetrying ? t('retrying') : t('retry')}
          </button>
        </div>
      </div>
    </div>
  )
}

function TransactionHistoryNextPageError({ isRetrying, onRetry }: { isRetrying: boolean; onRetry: () => void }) {
  const t = useTranslations('Libo.history')

  return (
    <div className="rounded-xl bg-white/3 border border-white/7 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">{t('nextPageError')}</p>
        <button
          className="text-xs font-medium text-zinc-300 hover:text-zinc-100 disabled:opacity-60 disabled:cursor-not-allowed transition"
          disabled={isRetrying}
          onClick={onRetry}
          type="button"
        >
          {isRetrying ? t('retrying') : t('nextPageRetry')}
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
