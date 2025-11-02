import { Locale } from '@/translation/common'
import { View } from '@/utils/param'

export enum Sort {
  RANDOM = 'random',
  ID_ASC = 'id_asc',
  POPULAR = 'popular',
}

export type GETProxyKSearchRequest = {
  query?: string
  view?: View
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
