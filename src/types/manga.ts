import { MangaSource } from '@/database/enum'

export interface ArtistWithSponsor extends LabeledValue {
  sponsors?: SponsorLink[]
}

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

export type Manga = {
  id: number
  title: string
  images?: ImageWithVariants[]
  artists?: ArtistWithSponsor[]
  bookmarkCount?: number
  characters?: LabeledValue[]
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

export type SponsorLink = {
  platform: string
  url: string
}
