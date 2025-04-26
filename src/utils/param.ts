import { harpiMangaPages } from '@/database/harpi'
import { hashaMangaPages } from '@/database/hasha'
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
  HASHA = 'ha',
  HARPI = 'hp',
  K_HENTAI = 'k',
  HITOMI = 'h',
  // E_HENTAI = 'e',
  // EX_HENTAI = 'ex',
}

export enum ViewParam {
  IMAGE = 'img',
  CARD = 'card',
}

export function getLoginId(loginId: string) {
  return decodeURIComponent(loginId).slice(1)
}

export function getTotalPages(source: string) {
  switch (source) {
    case SourceParam.HARPI:
      return harpiMangaPages.length
    case SourceParam.HASHA:
      return hashaMangaPages.length
    case SourceParam.HIYOBI:
      return 7300
    default:
      return 10
  }
}

export function mapSourceParamToBookmarkSource(order: SourceParam) {
  switch (order) {
    case SourceParam.HARPI:
      return BookmarkSource.HARPI
    case SourceParam.HASHA:
      return BookmarkSource.HASHA
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
    case SourceParam.HASHA:
      return SourceParam.HASHA
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
    case ViewParam.CARD:
      return ViewParam.CARD
    case ViewParam.IMAGE:
      return ViewParam.IMAGE
    default:
      return ''
  }
}
