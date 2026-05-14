import type { View } from '@litomi/std/param'
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
  fetchNextPage?: () => Promise<unknown> | void
  footer?: ReactNode
  hasNextPage?: boolean
  header?: ReactNode
  isFetchingNextPage?: boolean
  itemGap?: number
  items: readonly TItem[]
  measurementKey: number | string
  onScrollElementChange?: (element: HTMLElement | null) => void
  overscanCount?: number
  preloadRowCount?: number
  renderItem: (item: TItem, index: number) => ReactNode
  scrollRestorationKey: string
  scrollToOptions?: ScrollToOptions
  view: View
}

export type VirtualMangaGridRow<TItem extends VirtualMangaGridItem> =
  | {
      items: VirtualMangaGridPositionedItem<TItem>[]
      type: 'items'
    }
  | { type: 'footer' }
  | { type: 'header' }

export type VirtualMangaGridRowProps<TItem extends VirtualMangaGridItem> = {
  columnCount: number
  footer?: ReactNode
  header?: ReactNode
  itemGap: number
  renderItem: (item: TItem, index: number) => ReactNode
  rows: VirtualMangaGridRow<TItem>[]
}

export type VirtualMangaGridSize = {
  height: number
  minColumnWidth: number
  width: number
}
