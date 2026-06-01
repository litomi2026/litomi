import { MAX_MANGA_ID } from '@litomi/domain/manga/policy'

export const DEFAULT_SEARCH_SORT = ''

export const SEARCH_SUGGESTIONS = [
  'language:korean',
  'id:',
  'type:',
  'language:',
  'artist:',
  'group:',
  'series:',
  'character:',
  'uploader:',
  'female:',
  'male:',
  'mixed:',
  'other:',
]

export const SearchParam = {
  QUERY: 'query',
  SORT: 'sort',
  MIN_VIEW: 'min-view',
  MAX_VIEW: 'max-view',
  MIN_PAGE: 'min-page',
  MAX_PAGE: 'max-page',
  MIN_RATING: 'min-rating',
  MAX_RATING: 'max-rating',
  FROM: 'from',
  TO: 'to',
  NEXT_ID: 'next-id',
  NEXT_VIEWS: 'next-views',
  NEXT_VIEWS_ID: 'next-views-id',
  SKIP: 'skip',
} as const

export const SearchSort = {
  OLDEST: 'id_asc',
  POPULAR: 'popular',
  RANDOM: 'random',
} as const

export const FILTER_CONFIG = {
  [SearchParam.SORT]: {
    type: 'select',
  },
  [SearchParam.MIN_VIEW]: {
    type: 'number',
    min: 0,
    max: Number.MAX_SAFE_INTEGER,
  },
  [SearchParam.MAX_VIEW]: {
    type: 'number',
    min: 0,
    max: Number.MAX_SAFE_INTEGER,
  },
  [SearchParam.MIN_PAGE]: {
    type: 'number',
    min: 1,
    max: 10000,
  },
  [SearchParam.MAX_PAGE]: {
    type: 'number',
    min: 1,
    max: 10000,
  },
  [SearchParam.MIN_RATING]: {
    type: 'number',
    min: 0,
    max: 5,
    step: 0.1,
  },
  [SearchParam.MAX_RATING]: {
    type: 'number',
    min: 0,
    max: 5,
    step: 0.1,
  },
  [SearchParam.FROM]: {
    type: 'date',
  },
  [SearchParam.TO]: {
    type: 'date',
  },
  [SearchParam.NEXT_ID]: {
    type: 'number',
    min: 1,
    max: MAX_MANGA_ID,
  },
  [SearchParam.SKIP]: {
    type: 'number',
    min: 0,
    max: 10000,
  },
  [SearchParam.NEXT_VIEWS]: {
    type: 'number',
    min: 0,
    max: Number.MAX_SAFE_INTEGER,
  },
  [SearchParam.NEXT_VIEWS_ID]: {
    type: 'number',
    min: 1,
    max: MAX_MANGA_ID,
  },
} satisfies Record<FilterKey, FilterConfig>

export const FILTER_PARAM_KEYS = Object.keys(FILTER_CONFIG) as FilterKey[]
export const isDateFilter = (key: FilterKey) => FILTER_CONFIG[key]?.type === 'date'

export type FilterKey = Exclude<SearchParam, typeof SearchParam.QUERY>
export type FilterState = Partial<Record<FilterKey, string>>
export type SearchParam = (typeof SearchParam)[keyof typeof SearchParam]
export type SearchSort = (typeof SearchSort)[keyof typeof SearchSort]
export type SearchSortParamValue = SearchSort | typeof DEFAULT_SEARCH_SORT

type FilterConfig =
  | { type: 'date' }
  | {
      type: 'number'
      max: number
      min: number
      step?: number
    }
  | { type: 'select' }
