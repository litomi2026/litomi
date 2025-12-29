import { EXPANSION_TYPE, POINT_CONSTANTS } from '@/constants/points'
import { MAX_BOOKMARKS_PER_USER, MAX_LIBRARIES_PER_USER, MAX_READING_HISTORY_PER_USER } from '@/constants/policy'

type BookmarkItemId = 'large' | 'small'

type ExpansionParams = { type: 'bookmark'; itemId: BookmarkItemId } | { type: 'history' } | { type: 'library' }

type SpendParams = ExpansionParams | { type: 'badge' | 'theme' }

export function getExpansionConfig(params: ExpansionParams) {
  if (params.type === 'library') {
    return {
      expansionType: EXPANSION_TYPE.LIBRARY,
      baseLimit: MAX_LIBRARIES_PER_USER,
      maxExpansion: POINT_CONSTANTS.LIBRARY_MAX_EXPANSION,
      expansionAmount: POINT_CONSTANTS.LIBRARY_EXPANSION_AMOUNT,
    }
  }

  if (params.type === 'history') {
    return {
      expansionType: EXPANSION_TYPE.READING_HISTORY,
      baseLimit: MAX_READING_HISTORY_PER_USER,
      maxExpansion: POINT_CONSTANTS.HISTORY_MAX_EXPANSION,
      expansionAmount: POINT_CONSTANTS.HISTORY_EXPANSION_AMOUNT,
    }
  }

  if (params.itemId === 'small') {
    return {
      expansionType: EXPANSION_TYPE.BOOKMARK,
      baseLimit: MAX_BOOKMARKS_PER_USER,
      maxExpansion: POINT_CONSTANTS.BOOKMARK_MAX_EXPANSION,
      expansionAmount: POINT_CONSTANTS.BOOKMARK_EXPANSION_SMALL_AMOUNT,
    }
  }

  return {
    expansionType: EXPANSION_TYPE.BOOKMARK,
    baseLimit: MAX_BOOKMARKS_PER_USER,
    maxExpansion: POINT_CONSTANTS.BOOKMARK_MAX_EXPANSION,
    expansionAmount: POINT_CONSTANTS.BOOKMARK_EXPANSION_LARGE_AMOUNT,
  }
}

export function getSpendMeta(params: SpendParams) {
  const { type } = params

  if (type === 'library') {
    return {
      type,
      price: POINT_CONSTANTS.LIBRARY_EXPANSION_PRICE,
      description: '내 서재 확장 (+1개)',
    }
  }

  if (type === 'history') {
    return {
      type,
      price: POINT_CONSTANTS.HISTORY_EXPANSION_PRICE,
      description: '감상 기록 확장 (+100개)',
    }
  }

  if (type === 'bookmark') {
    if (params.itemId === 'small') {
      return {
        type,
        price: POINT_CONSTANTS.BOOKMARK_EXPANSION_SMALL_PRICE,
        description: `북마크 확장 (+${POINT_CONSTANTS.BOOKMARK_EXPANSION_SMALL_AMOUNT}개)`,
      }
    }

    return {
      type,
      price: POINT_CONSTANTS.BOOKMARK_EXPANSION_LARGE_PRICE,
      description: `북마크 확장 (+${POINT_CONSTANTS.BOOKMARK_EXPANSION_LARGE_AMOUNT}개)`,
    }
  }

  if (type === 'badge') {
    return {
      type,
      price: POINT_CONSTANTS.BADGE_PRICE,
      description: '프로필 뱃지 구매',
    }
  }

  return {
    type,
    price: POINT_CONSTANTS.THEME_PRICE,
    description: '커스텀 테마 구매',
  }
}

export function isBookmarkItemId(itemId: string | undefined): itemId is BookmarkItemId {
  return itemId === 'small' || itemId === 'large'
}
