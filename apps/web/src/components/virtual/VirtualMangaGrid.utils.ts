import type { VirtualMangaGridItem, VirtualMangaGridRow } from './VirtualMangaGrid.types'

export function chunkVirtualMangaGridItems<TItem extends VirtualMangaGridItem>(
  items: readonly TItem[],
  columnCount: number,
  isFullWidth?: (item: TItem) => boolean,
) {
  const safeColumnCount = Math.max(1, columnCount)
  const rows: VirtualMangaGridRow<TItem>[] = []
  let cells: { item: TItem; itemIndex: number }[] = []

  for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
    const item = items[itemIndex]

    if (isFullWidth?.(item)) {
      if (cells.length > 0) {
        rows.push({
          items: cells,
          type: 'items',
        })
        cells = []
      }

      rows.push({
        item,
        itemIndex,
        type: 'full',
      })
      continue
    }

    cells.push({ item, itemIndex })

    if (cells.length === safeColumnCount) {
      rows.push({
        items: cells,
        type: 'items',
      })
      cells = []
    }
  }

  if (cells.length > 0) {
    rows.push({
      items: cells,
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
