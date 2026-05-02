import type { RowComponentProps } from 'react-window'

import type { VirtualMangaGridItem, VirtualMangaGridRowProps } from './VirtualMangaGrid.types'

export default function VirtualMangaGridRow<TItem extends VirtualMangaGridItem>({
  index,
  style,
  columnCount,
  footer,
  gapPx,
  header,
  itemCount,
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
      className="grid items-stretch"
      data-virtual-manga-row-index={index}
      role="presentation"
      style={{
        ...style,
        gap: `${gapPx}px`,
        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
        paddingBlock: gapPx / 2,
      }}
    >
      {row.items.map(({ item, itemIndex }) => (
        <div
          aria-posinset={itemIndex + 1}
          aria-setsize={itemCount}
          className="min-w-0 h-full *:h-full"
          key={item.key}
          role="listitem"
        >
          {renderItem(item, itemIndex)}
        </div>
      ))}
    </div>
  )
}
