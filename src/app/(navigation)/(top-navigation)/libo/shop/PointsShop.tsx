'use client'

import { Bookmark, BookOpen, Check, LibraryBig, Star } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { POINT_CONSTANTS } from '@/constants/points'
import useMeQuery from '@/query/useMeQuery'
import { formatNumber } from '@/utils/format/number'

import { usePointsQuery } from '../usePointsQuery'
import { useExpansionQuery } from './useExpansionQuery'
import { useSpendPointsMutation } from './useSpendPointsMutation'

type EnrichedShopItem = ShopItem & {
  canAfford: boolean
  affordState: 'affordable' | 'unaffordable' | 'unknown'
  isMaxed: boolean
}

type ShopItem = {
  id: string
  type: 'badge' | 'bookmark' | 'history' | 'library' | 'rating' | 'theme'
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
  const { data: expansion } = useExpansionQuery({ enabled: isLoggedIn })
  const spendPoints = useSpendPointsMutation()
  const displayExpansion = isLoggedIn ? expansion : undefined
  const balance = points?.balance ?? null
  const [selectedItemId, setSelectedItemId] = useState<string>('bookmark-expansion-small')

  const unknown = '—'
  const isDataReady = me != null && points != null && expansion != null

  function formatCurrentMax(current?: number, max?: number, unit: string = '개') {
    const currentText = current == null ? unknown : formatNumber(current)
    const maxText = max == null ? unknown : formatNumber(max)
    return `${currentText}/${maxText}${unit}`
  }

  const shopItems: ShopItem[] = [
    {
      id: 'bookmark-expansion-small',
      type: 'bookmark',
      itemId: 'small',
      name: '북마크 확장',
      description: `+${POINT_CONSTANTS.BOOKMARK_EXPANSION_SMALL_AMOUNT}개 (현재: ${formatCurrentMax(displayExpansion?.bookmark.current, displayExpansion?.bookmark.max)})`,
      price: POINT_CONSTANTS.BOOKMARK_EXPANSION_SMALL_PRICE,
      icon: <Bookmark className="size-5" />,
    },
    {
      id: 'bookmark-expansion-large',
      type: 'bookmark',
      itemId: 'large',
      name: '북마크 확장',
      description: `+${POINT_CONSTANTS.BOOKMARK_EXPANSION_LARGE_AMOUNT}개 (현재: ${formatCurrentMax(displayExpansion?.bookmark.current, displayExpansion?.bookmark.max)})`,
      price: POINT_CONSTANTS.BOOKMARK_EXPANSION_LARGE_PRICE,
      icon: <Bookmark className="size-5" />,
    },
    {
      id: 'library-expansion',
      type: 'library',
      name: '내 서재 확장',
      description: `+${POINT_CONSTANTS.LIBRARY_EXPANSION_AMOUNT}개 (현재: ${formatCurrentMax(displayExpansion?.library.current, displayExpansion?.library.max)})`,
      price: POINT_CONSTANTS.LIBRARY_EXPANSION_PRICE,
      icon: <LibraryBig className="size-5" />,
    },
    {
      id: 'history-expansion',
      type: 'history',
      name: '감상 기록 확장',
      description: `+${POINT_CONSTANTS.HISTORY_EXPANSION_AMOUNT}개 (현재: ${formatCurrentMax(displayExpansion?.history.current, displayExpansion?.history.max)})`,
      price: POINT_CONSTANTS.HISTORY_EXPANSION_PRICE,
      icon: <BookOpen className="size-5" />,
    },
    {
      id: 'rating-expansion',
      type: 'rating',
      name: '평가 확장',
      description: `+${POINT_CONSTANTS.RATING_EXPANSION_AMOUNT}개 (현재: ${formatCurrentMax(displayExpansion?.rating.current, displayExpansion?.rating.max)})`,
      price: POINT_CONSTANTS.RATING_EXPANSION_PRICE,
      icon: <Star className="size-5" />,
    },
  ]

  function handlePurchase(item: ShopItem) {
    if (!isDataReady || spendPoints.isPending || balance == null) {
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
    })
  }

  const enrichedItems: EnrichedShopItem[] = shopItems.map((item) => {
    let unit = 0
    let expansionInfo: { current: number; max: number } | undefined

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
      case 'rating':
        unit = POINT_CONSTANTS.RATING_EXPANSION_AMOUNT
        expansionInfo = displayExpansion?.rating
        break
    }

    const affordState: EnrichedShopItem['affordState'] =
      balance == null ? 'unknown' : balance >= item.price ? 'affordable' : 'unaffordable'
    const canAfford = affordState === 'affordable'
    const isMaxed = isLoggedIn && expansionInfo ? expansionInfo.current + unit > expansionInfo.max : false

    return {
      ...item,
      canAfford,
      affordState,
      isMaxed,
    }
  })

  const selectedItem = enrichedItems.find((item) => item.id === selectedItemId) ?? null
  const isPurchasing = Boolean(spendPoints.isPending)
  const purchaseDisabled =
    !isDataReady || selectedItem === null || selectedItem.isMaxed || !selectedItem.canAfford || isPurchasing

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedItem) {
      return
    }
    handlePurchase(selectedItem)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-5 text-zinc-400">리보로 내 공간을 확장해 보세요</p>

      <div className="space-y-2" role="listbox">
        {enrichedItems.map((item) => {
          const isSelected = selectedItemId === item.id
          const isDisabled = item.isMaxed || spendPoints.isPending

          return (
            <button
              aria-disabled={isDisabled}
              aria-selected={isSelected}
              className="w-full text-left flex items-center gap-4 p-4 rounded-xl border bg-white/4 border-white/7 transition 
                hover:bg-white/5.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15 focus-visible:ring-offset-0 
                aria-selected:bg-brand/8 aria-selected:hover:bg-brand/10 aria-disabled:opacity-60 aria-disabled:hover:bg-white/4 aria-disabled:cursor-not-allowed"
              disabled={isDisabled}
              key={item.id}
              onClick={() => setSelectedItemId(item.id)}
              role="option"
              type="button"
            >
              <div className="size-10 rounded-lg flex items-center justify-center shrink-0 bg-white/5.5 border border-white/7 text-zinc-200">
                {item.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-zinc-200">{item.name}</h4>
                  {item.isMaxed && <span className="text-xs text-zinc-500">최대</span>}
                </div>
                <p className="text-sm text-zinc-500 truncate">{item.description}</p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <p
                  className="text-right font-semibold text-zinc-200 tabular-nums data-[afford=unaffordable]:text-zinc-500"
                  data-afford={item.affordState}
                >
                  {item.price.toLocaleString()} 리보
                </p>
                <span
                  aria-hidden="true"
                  aria-selected={isSelected}
                  className="inline-flex size-6 items-center justify-center rounded-full bg-brand/12 text-brand opacity-0 aria-selected:opacity-100 transition-opacity"
                >
                  <Check className="size-4" />
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* 단일 구매 바 (애플식) */}
      <div className="sticky bottom-0 pb-safe">
        <form
          className="rounded-xl bg-white/4 border border-white/7 p-3 flex items-center gap-3"
          onSubmit={handleSubmit}
        >
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
            type="submit"
          >
            {isPurchasing ? '처리 중…' : selectedItem?.isMaxed ? '최대' : '구매'}
          </button>
        </form>
      </div>
    </div>
  )
}
