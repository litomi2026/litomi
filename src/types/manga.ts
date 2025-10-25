import { MangaSource } from '@/database/enum'

export type ImageVariant = {
  url: string
  width?: number
  height?: number
}

export type ImageWithVariants = {
  original?: ImageVariant
  thumbnail?: ImageVariant
  medium?: ImageVariant
}

export type LabeledValue = {
  label: string
  value: string
}

export interface LabeledValueWithLink extends LabeledValue {
  links?: LabeledValue[]
}

export type Manga = {
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
  type?: LabeledValue
  uploader?: string
  viewCount?: number

  // Harpi
  harpiId?: string
}

export type MangaError = Manga & {
  isError: true
}

export type MangaTag = LabeledValue & {
  category: string
}
