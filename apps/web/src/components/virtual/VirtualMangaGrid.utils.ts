import type { VirtualMangaGridItem, VirtualMangaGridRow } from './VirtualMangaGrid.types'

export function chunkVirtualMangaGridItems<TItem extends VirtualMangaGridItem>(
  items: readonly TItem[],
  columnCount: number,
) {
  const safeColumnCount = Math.max(1, columnCount)
  const rows: VirtualMangaGridRow<TItem>[] = []

  for (let itemIndex = 0; itemIndex < items.length; itemIndex += safeColumnCount) {
    rows.push({
      items: items.slice(itemIndex, itemIndex + safeColumnCount).map((item, offset) => ({
        item,
        itemIndex: itemIndex + offset,
      })),
      type: 'items',
    })
  }

  return rows
}

export function getVirtualMangaGridColumnCount(containerWidth: number, minColumnWidth: number, itemGap = 0) {
  const safeContainerWidth = Math.max(1, containerWidth)
  const safeMinColumnWidth = Math.max(1, minColumnWidth)
  const safeItemGap = Math.max(0, itemGap)

  return Math.max(1, Math.floor((safeContainerWidth - safeItemGap) / (safeMinColumnWidth + safeItemGap)))
}
