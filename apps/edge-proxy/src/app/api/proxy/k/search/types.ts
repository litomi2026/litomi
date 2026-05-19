import type { Locale } from '@litomi/domain/locale'
import type { Manga } from '@litomi/domain/types/manga'

export enum Sort {
  RANDOM = 'random',
  ID_ASC = 'id_asc',
  POPULAR = 'popular',
}

export type GETProxyKSearchRequest = {
  query?: string
  sort?: Sort
  'min-rating'?: number
  'max-rating'?: number
  'min-view'?: number
  'max-view'?: number
  'min-page'?: number
  'max-page'?: number
  from?: number
  to?: number
  'next-id'?: number
  'next-views'?: number
  'next-views-id'?: number
  skip?: number
  locale?: Locale
}

export type GETProxyKSearchResponse = {
  mangas: Manga[]
  nextCursor: string | null
}
