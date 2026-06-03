export enum View {
  IMAGE = 'img',
  CARD = 'card',
}

export const VIEW_PARAM = 'view'

type SearchParamsLike = Pick<URLSearchParams, 'get'>

export function appendViewToPath(pathname: string, view: View) {
  return view === View.IMAGE ? `${pathname}?${VIEW_PARAM}=${View.IMAGE}` : pathname
}

export function convertCamelCaseToKebabCase(str: string) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase()
}

export function getUsernameFromParam(username: string) {
  return decodeURIComponent(username).slice(1)
}

export function getViewFromSearchParams(searchParams: SearchParamsLike) {
  return searchParams.get(VIEW_PARAM) === View.IMAGE ? View.IMAGE : View.CARD
}

export function setViewToSearchParams(searchParams: URLSearchParams, view: View) {
  if (view === View.IMAGE) {
    searchParams.set(VIEW_PARAM, View.IMAGE)
    return searchParams
  }

  searchParams.delete(VIEW_PARAM)
  return searchParams
}
