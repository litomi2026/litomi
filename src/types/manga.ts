import { MangaSource } from '@/database/enum'

export type LabeledValue = {
  label: string
  value: string
}

export type Manga = {
  id: number
  title: string
  images: string[]
  artists?: LabeledValue[]
  characters?: LabeledValue[]
  count?: number
  date?: string
  description?: string
  group?: LabeledValue[]
  languages?: LabeledValue[]
  like?: number
  likeAnonymous?: number
  lines?: string[]
  origin?: string
  rating?: number
  ratingCount?: number
  bookmarkCount?: number
  related?: number[]
  series?: LabeledValue[]
  source?: MangaSource
  sources?: MangaSource[]
  tags?: MangaTag[]
  type?: string
  viewCount?: number

  // Harpi
  harpiId?: string
}

export type MangaError = Manga & {
  isError: true
}

export type MangaTag = LabeledValue & {
  category: MangaTagCategory
}

export type MangaTagCategory = '' | 'female' | 'male' | 'mixed' | 'other'
