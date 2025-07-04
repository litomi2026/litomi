export type SearchFilter = {
  label: string
  value?: string
  description: string
}

export const SEARCH_FILTERS: SearchFilter[] = [
  { label: 'language:korean ', value: 'language:korean', description: '한국어' },
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
  { label: 'id:', value: 'gid:', description: 'ID' },
]
