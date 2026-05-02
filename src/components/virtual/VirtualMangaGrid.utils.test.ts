import { describe, expect, test } from 'bun:test'

import type { VirtualMangaGridItem } from './VirtualMangaGrid.types'

import { chunkVirtualMangaGridItems, getVirtualMangaGridColumnCount } from './VirtualMangaGrid.utils'

describe('chunkVirtualMangaGridItems', () => {
  test('chunks items while preserving their global item indexes', () => {
    const items: VirtualMangaGridItem[] = [
      { key: 'first' },
      { key: 'promotion' },
      { key: 'second' },
    ]

    expect(chunkVirtualMangaGridItems(items, 2)).toEqual([
      {
        items: [
          { item: items[0], itemIndex: 0 },
          { item: items[1], itemIndex: 1 },
        ],
        type: 'items',
      },
      {
        items: [{ item: items[2], itemIndex: 2 }],
        type: 'items',
      },
    ])
  })
})

describe('getVirtualMangaGridColumnCount', () => {
  test('falls back to at least one column for unsafe input', () => {
    expect(getVirtualMangaGridColumnCount(0, 0)).toBe(1)
  })
})
