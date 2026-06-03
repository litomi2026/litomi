import { SearchParam as SearchPageSearchParam } from '@/app/[locale]/(navigation)/search/constants'

type SearchFilter = {
  href: string
  isActive: boolean
}

export function getSearchFilter(filterPattern: string, searchParams?: URLSearchParams): SearchFilter {
  const params = new URLSearchParams(searchParams)
  const currentQuery = params.get(SearchPageSearchParam.QUERY) ?? ''
  const tokens = tokenizeSearchQuery(currentQuery)
  const isActive = tokens.includes(filterPattern)
  const toggled = isActive ? tokens.filter((token) => token !== filterPattern) : [...tokens, filterPattern]
  const nextQuery = toggled.join(' ')

  if (nextQuery) {
    params.set(SearchPageSearchParam.QUERY, nextQuery)
  } else {
    params.delete(SearchPageSearchParam.QUERY)
  }

  const nextSearchParams = params.toString()

  return {
    href: nextSearchParams ? `/search?${nextSearchParams}` : '/search',
    isActive,
  }
}

export function isSearchFilterActive(filterPattern: string, searchParams?: URLSearchParams) {
  const currentQuery = searchParams?.get(SearchPageSearchParam.QUERY) ?? ''
  const tokens = tokenizeSearchQuery(currentQuery)

  return tokens.includes(filterPattern)
}

function tokenizeSearchQuery(query: string) {
  return query.split(/\s+/).filter(Boolean)
}
