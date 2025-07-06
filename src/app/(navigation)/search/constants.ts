export type SearchFilter = {
  label: string
  value?: string
  description: string
}

export const SEARCH_FILTERS: SearchFilter[] = [
  { label: 'language:korean', description: '한국어' },
  { label: 'language:', description: '언어' },
  { label: 'female:', description: '여성 태그' },
  { label: 'male:', description: '남성 태그' },
  { label: 'mixed:', description: '혼합 태그' },
  { label: 'other:', description: '기타 태그' },
  { label: 'artist:', description: '작가' },
  { label: 'group:', description: '그룹' },
  { label: 'character:', description: '캐릭터' },
  { label: 'series:', value: 'parody:', description: '시리즈' },
  { label: 'type:', description: '종류' },
  { label: 'id:', value: 'gid:', description: '망가 ID' },
]

export const SEARCH_LABEL_TO_VALUE_MAP = SEARCH_FILTERS.reduce(
  (map, filter) => {
    if (filter.value) {
      map[filter.label] = filter.value
    }
    return map
  },
  {} as Record<string, string>,
)

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
    label: '조회수 범위',
    min: 0,
    max: Number.MAX_SAFE_INTEGER,
  },
  'max-view': {
    type: 'number' as const,
    label: '조회수 범위',
    min: 0,
    max: Number.MAX_SAFE_INTEGER,
  },
  'min-page': {
    type: 'number' as const,
    label: '페이지 수 범위',
    min: 1,
    max: 10000,
  },
  'max-page': {
    type: 'number' as const,
    label: '페이지 수 범위',
    min: 1,
    max: 10000,
  },
  from: {
    type: 'date' as const,
    label: '날짜 범위',
    placeholder: '시작일',
  },
  to: {
    type: 'date' as const,
    label: '날짜 범위',
    placeholder: '종료일',
  },
} as const

export const FILTER_KEYS = ['sort', 'min-view', 'max-view', 'min-page', 'max-page', 'from', 'to'] as const

export type FilterKey = (typeof FILTER_KEYS)[number]
export type FilterState = Partial<Record<FilterKey, string>>

export const isDateFilter = (key: FilterKey) => FILTER_CONFIG[key].type === 'date'

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
