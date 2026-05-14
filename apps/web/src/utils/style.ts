import { View } from '@/utils/param'

const MANGA_GRID_TEMPLATE_COLUMN = `grid-cols-[repeat(auto-fill,minmax(var(--manga-grid-column-min-width),1fr))]`

export const MANGA_GRID_COLUMN_MIN_WIDTH_CLASS = {
  [View.IMAGE]: [
    '[--manga-grid-column-min-width:160px]',
    'sm:[--manga-grid-column-min-width:180px]',
    'md:[--manga-grid-column-min-width:200px]',
    'lg:[--manga-grid-column-min-width:220px]',
    'xl:[--manga-grid-column-min-width:240px]',
  ].join(' '),
  [View.CARD]: [
    '[--manga-grid-column-min-width:250px]',
    'sm:[--manga-grid-column-min-width:280px]',
    'lg:[--manga-grid-column-min-width:300px]',
    'xl:[--manga-grid-column-min-width:320px]',
  ].join(' '),
} as const

export const MANGA_GRID_COLUMN = {
  img: [MANGA_GRID_TEMPLATE_COLUMN, MANGA_GRID_COLUMN_MIN_WIDTH_CLASS.img].join(' '),
  card: [MANGA_GRID_TEMPLATE_COLUMN, MANGA_GRID_COLUMN_MIN_WIDTH_CLASS.card].join(' '),
} as const

export function readMangaGridColumnMinWidth(element: Element) {
  if (typeof window === 'undefined') {
    return null
  }

  const mangaGridColumnMinWidth = window.getComputedStyle(element).getPropertyValue('--manga-grid-column-min-width')
  const minWidth = parseFloat(mangaGridColumnMinWidth)

  return Number.isFinite(minWidth) && minWidth > 0 ? minWidth : null
}
