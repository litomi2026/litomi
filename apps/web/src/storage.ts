import type { UserSettings } from '@litomi/domain/utils/user-settings'

export enum BroadcastChannelKey {
  USER_SETTINGS = 'user-settings',
}

export enum LocalStorageKey {
  BBATON_ADULT_VERIFICATION_SIGNAL = 'bbaton-adult-verification-signal',
  CHAT_WEBLLM_SETTINGS = 'chat-webllm-settings',
  RECENT_SEARCHES = 'recent-searches',
  RECENT_SEARCHES_ENABLED = 'recent-searches-enabled',
  SEARCH_LANGUAGE = 'search-language:v1',
  THEME = 'theme',
}

export enum SearchParamKey {
  REDIRECT = 'redirect',
}

export enum SessionStorageKey {
  READING_HISTORY = 'rh',
  SEARCH_TRENDING_VIEW = 'search-trending-view',
}

export type UserSettingsBroadcastMessage = {
  settings: UserSettings
  userId: number
}

export const SessionStorageKeyMap = {
  readingHistory: () => `${SessionStorageKey.READING_HISTORY}:v1`,
  searchTrendingView: (query: string) => `${SessionStorageKey.SEARCH_TRENDING_VIEW}:v1:${encodeURIComponent(query)}`,
} as const
