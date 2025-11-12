import { DEFAULT_SUGGESTIONS } from '@/constants/json'
import { MAX_MANGA_ID } from '@/constants/policy'

// value: 소문자여야 함
export const SEARCH_SUGGESTIONS = [
  { value: 'language:korean', label: '한국어' },
  { value: 'id:', label: '품번' },
  { value: 'type:', label: '종류' },
  ...DEFAULT_SUGGESTIONS,
]

export type SearchSuggestion = (typeof SEARCH_SUGGESTIONS)[number]

export const FILTER_CONFIG = {
  sort: {
    type: 'select' as const,
    label: '정렬',
    options: [
      { value: '', label: '최신순' },
      { value: 'popular', label: '인기순' },
      { value: 'random', label: '랜덤' },
      { value: 'id_asc', label: '오래된 순' },
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
  'min-rating': {
    type: 'number' as const,
    label: '별점',
    min: 0,
    max: 5,
    step: 0.1,
  },
  'max-rating': {
    type: 'number' as const,
    label: '별점',
    min: 0,
    max: 5,
    step: 0.1,
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
    max: MAX_MANGA_ID,
    placeholder: '특정 ID부터 검색',
  },
  skip: {
    type: 'number' as const,
    label: '건너뛰기',
    min: 0,
    max: 10000,
    placeholder: '처음 N개 건너뛰기',
  },
  'next-views': {
    type: 'number' as const,
    label: '시작 조회수',
    min: 0,
    max: Number.MAX_SAFE_INTEGER,
    placeholder: '123,456',
  },
  'next-views-id': {
    type: 'number' as const,
    label: '시작 ID (인기순)',
    min: 1,
    max: MAX_MANGA_ID,
    placeholder: '특정 ID부터 검색 (인기순)',
  },
} as const

export const FILTER_KEYS = Object.keys(FILTER_CONFIG) as (keyof typeof FILTER_CONFIG)[]
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
