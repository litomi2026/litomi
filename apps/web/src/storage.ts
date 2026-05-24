export enum LocalStorageKey {
  BBATON_ADULT_VERIFICATION_SIGNAL = 'bbaton-adult-verification-signal',
  CHAT_WEBLLM_SETTINGS = 'chat-webllm-settings',
  RECENT_SEARCHES = 'recent-searches',
  RECENT_SEARCHES_ENABLED = 'recent-searches-enabled',
  THEME = 'theme',
  USER_SETTINGS_SIGNAL = 'user-settings-signal',
}

export enum SearchParamKey {
  REDIRECT = 'redirect',
}

export enum SessionStorageKey {
  READING_HISTORY = 'rh',
}

export const SessionStorageKeyMap = {
  readingHistory: () => `${SessionStorageKey.READING_HISTORY}:v1`,
} as const
