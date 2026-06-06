import { SearchParam } from './constants'

export function createCanonicalSearchParams(searchParams: URLSearchParams) {
  const params = new URLSearchParams(searchParams)
  const query = canonicalizeSearchQuery(params.get(SearchParam.QUERY))

  if (query) {
    params.set(SearchParam.QUERY, query)
  } else {
    params.delete(SearchParam.QUERY)
  }

  params.sort()
  return params
}

function canonicalizeSearchQuery(query: string | null) {
  const tokens = query?.trim().split(/\s+/).filter(Boolean) ?? []

  if (tokens.length === 0) {
    return ''
  }

  return tokens.sort(compareSearchQueryToken).join(' ')
}

function compareSearchQueryToken(a: string, b: string) {
  const normalizedA = a.toLowerCase()
  const normalizedB = b.toLowerCase()

  if (normalizedA < normalizedB) {
    return -1
  }
  if (normalizedA > normalizedB) {
    return 1
  }
  if (a < b) {
    return -1
  }
  if (a > b) {
    return 1
  }
  return 0
}
