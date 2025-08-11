export enum SortParam {
  // BOOKMARK = 'bookmark',
  LATEST = 'latest',
  OLDEST = 'oldest',
  POPULAR = 'popular',
  // LIKE = 'like',
}

export enum SourceParam {
  HIYOBI = 'hi',
  HARPI = 'hp',
  K_HENTAI = 'k',
  HITOMI = 'h',
  // E_HENTAI = 'e',
  // EX_HENTAI = 'ex',
}

export enum ViewCookie {
  IMAGE = 'img',
  CARD = 'card',
}

export function convertCamelCaseToKebabCase(str: string) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase()
}

export function getTotalPages(source: string) {
  switch (source) {
    case SourceParam.HIYOBI:
      return 7500
    default:
      return 10
  }
}

export function getUsernameFromParam(username: string) {
  return decodeURIComponent(username).slice(1)
}

export function validatePage(page: string) {
  const pageNumber = parseInt(page, 10)

  if (isNaN(pageNumber) || !isFinite(pageNumber) || pageNumber < 1) {
    return 0
  }

  return pageNumber
}

export function validateSource(src: string) {
  switch (src) {
    case SourceParam.HARPI:
      return SourceParam.HARPI
    case SourceParam.HITOMI:
      return SourceParam.HITOMI
    case SourceParam.HIYOBI:
      return SourceParam.HIYOBI
    case SourceParam.K_HENTAI:
      return SourceParam.K_HENTAI
    default:
      return ''
  }
}

export function validateView(layout: string) {
  switch (layout) {
    case ViewCookie.CARD:
      return ViewCookie.CARD
    case ViewCookie.IMAGE:
      return ViewCookie.IMAGE
    default:
      return ''
  }
}

export function whitelistSearchParams(params: URLSearchParams, whitelist: readonly string[]) {
  const allowed = new Set(whitelist)
  const filtered = Array.from(params).filter(([key]) => allowed.has(key))
  return new URLSearchParams(filtered)
}
