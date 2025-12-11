import { MangaResponseScope } from '@/app/api/proxy/manga/[id]/types'
import { RatingSort } from '@/backend/api/v1/library/enum'
import { PostFilter } from '@/backend/api/v1/post/constant'

export const QueryKeys = {
  me: ['me'],
  bookmarks: ['me', 'bookmarks'],
  infiniteBookmarks: ['me', 'bookmarks', 'infinite'],
  infiniteReadingHistory: ['me', 'readingHistory', 'infinite'],
  infiniteRatings: (sort: RatingSort) => ['me', 'ratings', 'infinite', sort],
  censorship: ['me', 'censorships'],
  infiniteCensorships: ['me', 'censorships', 'infinite'],
  passkeys: ['me', 'passkeys'],
  notification: ['me', 'notifications'],
  notificationUnreadCount: ['me', 'notifications', 'unread-count'],
  notifications: (searchParams: URLSearchParams) => ['me', 'notifications', Object.fromEntries(searchParams)],
  libraries: ['me', 'libraries'],
  libraryItems: (libraryId: number) => ['me', 'library', libraryId],
  userRating: (mangaId: number) => ['me', 'rating', mangaId],
  readingHistory: (mangaId: number) => ['me', 'readingHistory', mangaId],
  points: ['me', 'points'],
  pointsExpansion: ['me', 'points', 'expansion'],
  pointsTransactions: ['me', 'points', 'transactions'],

  manga: (id: number, scope: MangaResponseScope | null) => ['manga', id, scope],
  mangaCard: (id: number) => ['mangaCard', id],
  search: (searchParams: URLSearchParams, locale: string) => ['search', locale, Object.fromEntries(searchParams)],
  searchSuggestions: (query: string, locale: string) => ['search', 'suggestions', locale, query],
  posts: (filter: PostFilter, mangaId?: number, username?: string) => ['posts', filter, { mangaId, username }],
  realtimeAnalytics: ['realtime-analytics'],
  trendingKeywords: (locale: string) => ['trending-keywords', locale],
  tag: (category: string, page: number, locale: string) => ['tag', category, page, locale],
}
