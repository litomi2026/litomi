import type { RowComponentProps } from 'react-window'

import { Fragment } from 'react'

import type { VirtualMangaGridItem, VirtualMangaGridRowProps } from './VirtualMangaGrid.types'

export default function VirtualMangaGridRow<TItem extends VirtualMangaGridItem>({
  index,
  style,
  columnCount,
  footer,
  header,
  renderItem,
  rows,
}: RowComponentProps<VirtualMangaGridRowProps<TItem>>) {
  const row = rows[index]

  if (!row) {
    return null
  }

  if (row.type === 'footer') {
    return (
      <div data-virtual-manga-row-index={index} role="presentation" style={style}>
        {footer}
      </div>
    )
  }

  if (row.type === 'header') {
    return (
      <div data-virtual-manga-row-index={index} role="presentation" style={style}>
        {header}
      </div>
    )
  }

  return (
    <div
      className="grid"
      data-virtual-manga-row-index={index}
      role="presentation"
      style={{ ...style, gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
    >
      {row.items.map(({ item, itemIndex }) => (
        <Fragment key={item.key}>{renderItem(item, itemIndex)}</Fragment>
      ))}
    </div>
  )
}
