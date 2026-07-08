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
  itemGap?: number
  items: readonly TItem[]
  renderItem: (item: TItem, index: number) => ReactNode
  view: View
}

export type VirtualMangaGridRow<TItem extends VirtualMangaGridItem> = {
  items: VirtualMangaGridPositionedItem<TItem>[]
  type: 'items'
}
