import { DEFAULT_SUGGESTIONS } from '@/constants/json'

// value: 소문자여야 함
export const SEARCH_SUGGESTIONS = [
  { value: 'language:korean', label: '한국어' },
  { value: 'language:', label: '언어' },
  ...DEFAULT_SUGGESTIONS,
  { value: 'type:', label: '종류' },
  { value: 'id:', label: '망가 ID' },
]

export type SearchSuggestion = (typeof SEARCH_SUGGESTIONS)[number]

export const FILTER_CONFIG = {
  sort: {
    type: 'select' as const,
    label: '정렬',
    options: [
      { value: '', label: '기본' },
      { value: 'random', label: '랜덤' },
      { value: 'id_asc', label: '오래된 순' },
      { value: 'popular', label: '인기순' },
    ],
  },
  'min-view': {
    type: 'number' as const,
    label: '조회수',
    min: 0,
    max: Number.MAX_SAFE_INTEGER,
  },
  'max-view': {
    type: 'number' as const,
    label: '조회수',
    min: 0,
    max: Number.MAX_SAFE_INTEGER,
  },
  'min-page': {
    type: 'number' as const,
    label: '페이지 수',
    min: 1,
    max: 10000,
  },
  'max-page': {
    type: 'number' as const,
    label: '페이지 수',
    min: 1,
    max: 10000,
  },
  from: {
    type: 'date' as const,
    label: '업로드 날짜',
    placeholder: '시작일',
  },
  to: {
    type: 'date' as const,
    label: '업로드 날짜',
    placeholder: '종료일',
  },
  'next-id': {
    type: 'number' as const,
    label: '시작 ID',
    min: 1,
    max: Number.MAX_SAFE_INTEGER,
    placeholder: '특정 ID부터 검색',
  },
  skip: {
    type: 'number' as const,
    label: '건너뛰기',
    min: 0,
    max: 10000,
    placeholder: '처음 N개 건너뛰기',
  },
} as const

export const FILTER_KEYS = [
  'sort',
  'min-view',
  'max-view',
  'min-page',
  'max-page',
  'from',
  'to',
  'next-id',
  'skip',
] as const

export const SEARCH_PAGE_SEARCH_PARAMS = [...FILTER_KEYS, 'query'] as const

export type FilterKey = (typeof FILTER_KEYS)[number]
export type FilterState = Partial<Record<FilterKey, string>>

export const isDateFilter = (key: FilterKey) => FILTER_CONFIG[key]?.type === 'date'

export const KOREAN_TO_ENGLISH_QUERY_KEYS: Record<string, string> = {
  언어: 'language',
  여성: 'female',
  여자: 'female',
  여: 'female',
  남성: 'male',
  남자: 'male',
  남: 'male',
  기타: 'other',
  혼합: 'mixed',
  작가: 'artist',
  그룹: 'group',
  캐릭터: 'character',
  시리즈: 'series',
  종류: 'type',
}

export const MIN_SUGGESTION_QUERY_LENGTH = 2
