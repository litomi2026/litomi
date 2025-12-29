'use client'

import { Bookmark, BookOpen, FolderPlus } from 'lucide-react'
import { toast } from 'sonner'

import IconSpinner from '@/components/icons/IconSpinner'
import { POINT_CONSTANTS } from '@/constants/points'
import useMeQuery from '@/query/useMeQuery'
import { formatNumber } from '@/utils/format'

import { usePointsQuery } from '../usePointsQuery'
import { useExpansionQuery } from './useExpansionQuery'
import { useSpendPointsMutation } from './useSpendPointsMutation'

type ShopItem = {
  id: string
  type: 'badge' | 'bookmark' | 'history' | 'library' | 'theme'
  name: string
  description: string
  price: number
  icon: React.ReactNode
  itemId?: string
}

export default function PointsShop() {
  const { data: me } = useMeQuery()
  const isLoggedIn = Boolean(me)
  const { data: points } = usePointsQuery({ enabled: isLoggedIn })
  const { data: expansion, isLoading } = useExpansionQuery({ enabled: isLoggedIn })
  const spendPoints = useSpendPointsMutation()
  const displayExpansion = isLoggedIn ? expansion : undefined
  const balance = points?.balance ?? 0

  if (isLoggedIn && isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <IconSpinner className="size-6" />
      </div>
    )
  }

  const shopItems: ShopItem[] = [
    {
      id: 'bookmark-expansion-small',
      type: 'bookmark',
      itemId: 'small',
      name: '북마크 확장',
      description: `+${POINT_CONSTANTS.BOOKMARK_EXPANSION_SMALL_AMOUNT}개 (현재: ${displayExpansion?.bookmark.current ?? 500}/${displayExpansion?.bookmark.max ?? 5000}개)`,
      price: POINT_CONSTANTS.BOOKMARK_EXPANSION_SMALL_PRICE,
      icon: <Bookmark className="size-5" />,
    },
    {
      id: 'bookmark-expansion-large',
      type: 'bookmark',
      itemId: 'large',
      name: '북마크 확장',
      description: `+${POINT_CONSTANTS.BOOKMARK_EXPANSION_LARGE_AMOUNT}개 (현재: ${displayExpansion?.bookmark.current ?? 500}/${displayExpansion?.bookmark.max ?? 5000}개)`,
      price: POINT_CONSTANTS.BOOKMARK_EXPANSION_LARGE_PRICE,
      icon: <Bookmark className="size-5" />,
    },
    {
      id: 'library-expansion',
      type: 'library',
      name: '내 서재 확장',
      description: `+${POINT_CONSTANTS.LIBRARY_EXPANSION_AMOUNT}개 (현재: ${displayExpansion?.library.current ?? 5}/${displayExpansion?.library.max ?? 30}개)`,
      price: POINT_CONSTANTS.LIBRARY_EXPANSION_PRICE,
      icon: <FolderPlus className="size-5" />,
    },
    {
      id: 'history-expansion',
      type: 'history',
      name: '감상 기록 확장',
      description: `+${POINT_CONSTANTS.HISTORY_EXPANSION_AMOUNT}개 (현재: ${displayExpansion?.history.current ?? 500}/${displayExpansion?.history.max ?? 5000}개)`,
      price: POINT_CONSTANTS.HISTORY_EXPANSION_PRICE,
      icon: <BookOpen className="size-5" />,
    },
  ]

  function handlePurchase(item: ShopItem) {
    if (!isLoggedIn || spendPoints.isPending) {
      return
    }

    if (balance < item.price) {
      toast.error('리보가 부족해요')
      return
    }

    const variables = {
      type: item.type,
      itemId: item.itemId,
    }

    spendPoints.mutate(variables, {
      onSuccess: (data) => {
        toast.success('구매 완료!', { description: `${item.name} - 잔액: ${formatNumber(data.balance)} 리보` })
      },
      onError: (err) => {
        toast.error(err.message || '구매에 실패했어요')
      },
    })
  }

  return (
    <div aria-disabled={!isLoggedIn} className="space-y-3 aria-disabled:opacity-80">
      {isLoggedIn ? (
        <p className="text-sm leading-5 text-zinc-400 mb-4">리보로 내 공간을 확장해 보세요</p>
      ) : (
        <p className="text-xs leading-5 text-zinc-500 mb-4">로그인하면 상점을 이용할 수 있어요</p>
      )}

      {shopItems.map((item) => {
        const canAfford = balance >= item.price

        const isPurchasing =
          spendPoints.isPending &&
          spendPoints.variables?.type === item.type &&
          spendPoints.variables?.itemId === item.itemId

        let unit = 0
        let expansionInfo

        switch (item.type) {
          case 'bookmark':
            unit =
              item.itemId === 'large'
                ? POINT_CONSTANTS.BOOKMARK_EXPANSION_LARGE_AMOUNT
                : POINT_CONSTANTS.BOOKMARK_EXPANSION_SMALL_AMOUNT
            expansionInfo = displayExpansion?.bookmark
            break
          case 'history':
            unit = POINT_CONSTANTS.HISTORY_EXPANSION_AMOUNT
            expansionInfo = displayExpansion?.history
            break
          case 'library':
            unit = POINT_CONSTANTS.LIBRARY_EXPANSION_AMOUNT
            expansionInfo = displayExpansion?.library
            break
        }

        const isMaxed = isLoggedIn && expansionInfo ? expansionInfo.current + unit > expansionInfo.max : false
        const isDisabled = !isLoggedIn || isMaxed || !canAfford || spendPoints.isPending

        return (
          <div
            aria-disabled={isMaxed}
            className="flex items-center gap-4 p-4 rounded-lg border transition bg-zinc-800/50 border-zinc-700 hover:border-zinc-600 aria-disabled:bg-zinc-800/30 aria-disabled:border-zinc-700/50 aria-disabled:opacity-60 aria-disabled:hover:border-zinc-700/50"
            key={item.id}
          >
            <div
              className="size-10 rounded-lg flex items-center justify-center shrink-0 bg-blue-500/20 text-blue-400 data-[type=badge]:bg-amber-500/20 data-[type=badge]:text-amber-400 data-[type=theme]:bg-purple-500/20 data-[type=theme]:text-purple-400"
              data-type={item.type}
            >
              {item.icon}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-zinc-200">{item.name}</h4>
              <p className="text-sm text-zinc-500 truncate">{item.description}</p>
            </div>

            <div className="text-right shrink-0">
              <p aria-disabled={!canAfford} className="font-bold text-amber-400 aria-disabled:text-zinc-500">
                {item.price.toLocaleString()} 리보
              </p>
              <button
                aria-disabled={isDisabled}
                className="mt-1 px-3 py-1 text-xs font-medium rounded-md transition bg-amber-500 text-zinc-900 hover:bg-amber-400 aria-disabled:bg-zinc-700 aria-disabled:text-zinc-400 aria-disabled:cursor-not-allowed aria-disabled:hover:bg-zinc-700"
                disabled={isDisabled}
                onClick={() => handlePurchase(item)}
              >
                {isPurchasing ? <IconSpinner className="size-3 mx-2" /> : isMaxed ? '최대' : '구매'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
