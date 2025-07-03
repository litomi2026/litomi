export type SearchFilter = {
  label: string
  description: string
}

export const SEARCH_FILTERS: SearchFilter[] = [
  { label: 'language:', description: '언어로 검색' },
  { label: 'female:', description: '여성 태그로 검색' },
  { label: 'male:', description: '남성 태그로 검색' },
  { label: 'artist:', description: '작가로 검색' },
  { label: 'group:', description: '그룹으로 검색' },
  { label: 'character:', description: '캐릭터로 검색' },
  { label: 'series:', description: '시리즈로 검색' },
  { label: 'type:', description: '타입으로 검색' },
  { label: 'tag:', description: '태그로 검색' },
]
