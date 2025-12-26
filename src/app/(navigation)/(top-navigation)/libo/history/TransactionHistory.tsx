'use client'

import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'

import IconSpinner from '@/components/icons/IconSpinner'
import useMeQuery from '@/query/useMeQuery'
import { formatDistanceToNow } from '@/utils/date'
import { formatNumber } from '@/utils/format'

import { useTransactionsQuery } from './useTransactionsQuery'

export default function TransactionHistory() {
  const { data: me } = useMeQuery()
  const isLoggedIn = Boolean(me)

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useTransactionsQuery({
    enabled: isLoggedIn,
  })

  const transactions = data?.pages.flatMap((page) => page.items) ?? []

  if (!isLoggedIn) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-500">로그인하면 거래 내역을 확인할 수 있어요</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <IconSpinner className="size-6" />
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-500">거래 내역이 없어요</p>
        <p className="text-sm text-zinc-600 mt-1">광고를 클릭하여 리보를 적립해보세요!</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-lg" key={tx.id}>
          <div
            className={`size-8 rounded-full flex items-center justify-center shrink-0
            ${tx.type === 'earn' ? 'bg-green-500/20' : 'bg-red-500/20'}`}
          >
            {tx.type === 'earn' ? (
              <ArrowDownLeft className="size-4 text-green-400" />
            ) : (
              <ArrowUpRight className="size-4 text-red-400" />
            )}
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
            <p className={`font-medium ${tx.type === 'earn' ? 'text-green-400' : 'text-red-400'}`}>
              {tx.type === 'earn' ? '+' : ''}
              {tx.amount.toLocaleString()} 리보
            </p>
            <p className="text-xs text-zinc-500" title={tx.balanceAfter.toLocaleString()}>
              잔액 {formatNumber(tx.balanceAfter)} 리보
            </p>
          </div>
        </div>
      ))}

      {hasNextPage && (
        <button
          className="w-full py-2 text-sm text-zinc-400 hover:text-zinc-300 transition"
          disabled={isFetchingNextPage}
          onClick={() => fetchNextPage()}
        >
          {isFetchingNextPage ? <IconSpinner className="size-4 mx-auto" /> : '더 보기'}
        </button>
      )}
    </div>
  )
}
