import type { MangaSource } from '@litomi/domain/manga/model'

export interface ImageVariant {
  url: string
  width?: number
  height?: number
}

export interface ImageWithVariants {
  original?: ImageVariant
  thumbnail?: ImageVariant
  medium?: ImageVariant
}

export interface LabeledValue {
  label: string
  value: string
}

export interface LabeledValueWithLink extends LabeledValue {
  links?: LabeledValue[]
}

export interface MangaTag extends LabeledValue {
  category: string
}

export interface MangaTorrent {
  added: number
  fsize: number
  hash: string
  name: string
  tsize: number
}

export interface CatalogManga {
  id: number
  title: string
  images?: ImageWithVariants[]
  artists?: LabeledValueWithLink[]
  bookmarkCount?: number
  characters?: LabeledValueWithLink[]
  count?: number
  date?: string
  description?: string
  filesize?: number
  group?: LabeledValue[]
  harpiId?: string
  languages?: LabeledValue[]
  like?: number
  likeAnonymous?: number
  lines?: string[]
  rating?: number
  ratingCount?: number
  related?: number[]
  series?: LabeledValue[]
  source?: MangaSource
  sources?: MangaSource[]
  tags?: MangaTag[]
  torrentCount?: number
  torrents?: MangaTorrent[]
  type?: LabeledValue
  uploader?: string
  viewCount?: number
}
