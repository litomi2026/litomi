'use client'

import { Bookmark, BookOpen, LibraryBig } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { POINT_CONSTANTS } from '@/constants/points'
import useMeQuery from '@/query/useMeQuery'
import { formatNumber } from '@/utils/format/number'

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
  const [selectedItemId, setSelectedItemId] = useState<string>('bookmark-expansion-small')

  if (isLoggedIn && isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-zinc-400">불러오는 중이에요</p>
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
      icon: <LibraryBig className="size-5" />,
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
        toast.success('구매됐어요', { description: `${item.name} · 잔액 ${formatNumber(data.balance)} 리보` })
      },
      onError: (err) => {
        toast.error(err.message || '구매에 실패했어요')
      },
    })
  }

  const enrichedItems = shopItems.map((item) => {
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

    const canAfford = balance >= item.price
    const isMaxed = isLoggedIn && expansionInfo ? expansionInfo.current + unit > expansionInfo.max : false

    return {
      ...item,
      canAfford,
      isMaxed,
    }
  })

  const selectedItem = enrichedItems.find((item) => item.id === selectedItemId) ?? null
  const isPurchasing = Boolean(spendPoints.isPending)
  const purchaseDisabled =
    !isLoggedIn || selectedItem === null || selectedItem.isMaxed || !selectedItem.canAfford || isPurchasing

  return (
    <div aria-disabled={!isLoggedIn} className="space-y-4 aria-disabled:opacity-80">
      {isLoggedIn ? (
        <p className="text-sm leading-5 text-zinc-400">리보로 내 공간을 확장해 보세요</p>
      ) : (
        <p className="text-xs leading-5 text-zinc-500">로그인하면 상점을 이용할 수 있어요</p>
      )}

      <div className="space-y-2" role="listbox">
        {enrichedItems.map((item) => {
          const isSelected = selectedItemId === item.id
          const isDisabled = item.isMaxed || spendPoints.isPending

          return (
            <button
              aria-disabled={isDisabled}
              aria-selected={isSelected}
              className="w-full text-left flex items-center gap-4 p-4 rounded-xl border bg-white/[0.035] border-white/[0.07] hover:bg-white/5.5 aria-selected:bg-white/5 aria-selected:border-white/10 aria-disabled:opacity-60 aria-disabled:hover:bg-white/[0.035] aria-disabled:cursor-not-allowed transition"
              disabled={isDisabled}
              key={item.id}
              onClick={() => setSelectedItemId(item.id)}
              role="option"
              type="button"
            >
              <div className="size-10 rounded-lg flex items-center justify-center shrink-0 bg-white/5.5 border border-white/[0.07] text-zinc-200">
                {item.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-zinc-200">{item.name}</h4>
                  {item.isMaxed && <span className="text-xs text-zinc-500">최대</span>}
                </div>
                <p className="text-sm text-zinc-500 truncate">{item.description}</p>
              </div>

              <div className="text-right shrink-0">
                <p
                  aria-disabled={!item.canAfford}
                  className="font-semibold text-zinc-200 aria-disabled:text-zinc-500 tabular-nums"
                >
                  {item.price.toLocaleString()} 리보
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* 단일 구매 바 (애플식) */}
      <div className="sticky bottom-0 pb-safe">
        <div className="rounded-xl bg-white/[0.035] border border-white/[0.07] p-3 flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">
              {selectedItem ? selectedItem.name : '상품을 선택해 주세요'}
            </p>
            <p className="text-xs text-zinc-500 truncate">
              {selectedItem ? `${selectedItem.price.toLocaleString()} 리보` : ''}
            </p>
          </div>

          <button
            className="ml-auto inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-zinc-950 bg-brand disabled:bg-zinc-800 disabled:text-zinc-400 disabled:cursor-not-allowed transition"
            disabled={purchaseDisabled}
            onClick={() => {
              if (!selectedItem) {
                return
              }
              handlePurchase(selectedItem)
            }}
            type="button"
          >
            {isPurchasing ? '처리 중…' : selectedItem?.isMaxed ? '최대' : '구매'}
          </button>
        </div>
      </div>
    </div>
  )
}
