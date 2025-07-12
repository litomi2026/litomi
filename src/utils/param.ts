import { BookmarkSource } from '@/database/schema'

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

export function getLoginId(loginId: string) {
  return decodeURIComponent(loginId).slice(1)
}

export function getTotalPages(source: string) {
  switch (source) {
    case SourceParam.HIYOBI:
      return 7300
    default:
      return 10
  }
}

export function mapBookmarkSourceToSourceParam(source: BookmarkSource) {
  switch (source) {
    case BookmarkSource.HARPI:
      return SourceParam.HARPI
    case BookmarkSource.HIYOBI:
      return SourceParam.HIYOBI
    case BookmarkSource.K_HENTAI:
      return SourceParam.K_HENTAI
    default:
      return SourceParam.K_HENTAI
  }
}

export function mapSourceParamToBookmarkSource(order: SourceParam) {
  switch (order) {
    case SourceParam.HARPI:
      return BookmarkSource.HARPI
    case SourceParam.HIYOBI:
      return BookmarkSource.HIYOBI
    case SourceParam.K_HENTAI:
      return BookmarkSource.K_HENTAI
    default:
      return
  }
}

export function validateId(id: string) {
  const idNumber = parseInt(id, 10)

  if (isNaN(idNumber) || !isFinite(idNumber) || idNumber < 1) {
    return 0
  }

  return idNumber
}

export function validatePage(page: string) {
  const pageNumber = parseInt(page, 10)

  if (isNaN(pageNumber) || !isFinite(pageNumber) || pageNumber < 1) {
    return 0
  }

  return pageNumber
}

export function validatePositiveNumber(str?: string | null) {
  if (!str) return 0

  const num = parseInt(str, 10)

  if (isNaN(num) || !isFinite(num) || num < 1 || num > Number.MAX_SAFE_INTEGER) {
    return 0
  }

  return num
}

export function validatePostFilter(str: string) {
  switch (str) {
    case 'following':
      return 'following'
    case 'recommand':
      return 'recommand'
    default:
      return ''
  }
}

export function validateSort(order: string) {
  switch (order) {
    case SortParam.LATEST:
      return SortParam.LATEST
    case SortParam.OLDEST:
      return SortParam.OLDEST
    case SortParam.POPULAR:
      return SortParam.POPULAR
    default:
      return ''
  }
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
