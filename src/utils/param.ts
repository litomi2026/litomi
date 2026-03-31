export enum View {
  IMAGE = 'img',
  CARD = 'card',
}

type SearchParamsLike = Pick<URLSearchParams, 'get'>

export function appendViewToPath(pathname: string, view: View) {
  return view === View.IMAGE ? `${pathname}?view=${View.IMAGE}` : pathname
}

export function convertCamelCaseToKebabCase(str: string) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase()
}

export function getUsernameFromParam(username: string) {
  return decodeURIComponent(username).slice(1)
}

export function getViewFromSearchParams(searchParams: SearchParamsLike) {
  return searchParams.get('view') === View.IMAGE ? View.IMAGE : View.CARD
}

export function setViewToSearchParams(searchParams: URLSearchParams, view: View) {
  if (view === View.IMAGE) {
    searchParams.set('view', View.IMAGE)
    return searchParams
  }

  searchParams.delete('view')
  return searchParams
}

export function whitelistSearchParams(params: URLSearchParams, whitelist: readonly string[]) {
  const allowed = new Set(whitelist)
  const filtered = Array.from(params).filter(([key]) => allowed.has(key))
  return new URLSearchParams(filtered)
}
