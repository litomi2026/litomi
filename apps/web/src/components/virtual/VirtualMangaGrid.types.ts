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
  className?: string
  fetchNextPage?: () => Promise<unknown> | undefined
  footer?: ReactNode
  hasNextPage?: boolean
  header?: ReactNode
  isFetchingNextPage?: boolean
  itemGap?: number
  items: readonly TItem[]
  renderItem: (item: TItem, index: number) => ReactNode
  scrollRestorationKey?: string
  scrollToOptions?: ScrollToOptions
  view: View
}

export type VirtualMangaGridRow<TItem extends VirtualMangaGridItem> = {
  items: VirtualMangaGridPositionedItem<TItem>[]
  type: 'items'
}
