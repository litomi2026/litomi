import type { RowComponentProps } from 'react-window'

import { Fragment } from 'react'

import type { VirtualMangaGridItem, VirtualMangaGridRowProps } from './VirtualMangaGrid.types'

export default function VirtualMangaGridRow<TItem extends VirtualMangaGridItem>({
  index,
  style,
  columnCount,
  footer,
  header,
  itemGap,
  renderItem,
  rows,
}: RowComponentProps<VirtualMangaGridRowProps<TItem>>) {
  const row = rows[index]

  if (!row) {
    return null
  }

  const previousRow = rows[index - 1]
  const isFirstItemRow = previousRow?.type !== 'items'

  if (row.type === 'footer') {
    return (
      <div data-virtual-row-index={index} role="presentation" style={style}>
        {footer}
      </div>
    )
  }

  if (row.type === 'header') {
    return (
      <div data-virtual-row-index={index} role="presentation" style={style}>
        {header}
      </div>
    )
  }

  return (
    <div
      className="grid"
      data-virtual-row-index={index}
      role="presentation"
      style={{
        ...style,
        gap: itemGap,
        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
        paddingBottom: itemGap,
        paddingInline: itemGap,
        paddingTop: isFirstItemRow ? itemGap : 0,
      }}
    >
      {row.items.map(({ item, itemIndex }) => (
        <Fragment key={item.key}>{renderItem(item, itemIndex)}</Fragment>
      ))}
    </div>
  )
}
