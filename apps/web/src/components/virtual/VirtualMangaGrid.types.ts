import type { View } from '@litomi/std'
import type { Key, ReactNode } from 'react'

export type VirtualMangaGridItem = {
  key: Key
}

export type VirtualMangaGridPositionedItem<TItem extends VirtualMangaGridItem> = {
  item: TItem
  itemIndex: number
}

export type VirtualMangaGridProps<TItem extends VirtualMangaGridItem> = {
  fetchNextPage: () => Promise<unknown> | undefined
  footer?: ReactNode
  hasNextPage: boolean
  header?: ReactNode
  /**
   * 전체 폭을 차지하는 섹션 헤더 아이템을 판별해요. 해당 아이템은 자체 full-width 행으로 렌더되고
   * 행 청킹의 경계가 돼요(그룹 간 카드가 한 행에 섞이지 않아요). 생략하면 모든 아이템이 카드 셀이에요.
   */
  isFullWidth?: (item: TItem) => boolean
  itemGap?: number
  items: readonly TItem[]
  renderItem: (item: TItem, index: number) => ReactNode
  view: View
}

export type VirtualMangaGridRow<TItem extends VirtualMangaGridItem> =
  | {
      items: VirtualMangaGridPositionedItem<TItem>[]
      type: 'items'
    }
  | {
      item: TItem
      itemIndex: number
      type: 'full'
    }
