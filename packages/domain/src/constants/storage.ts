export enum CookieKey {
  ACCESS_TOKEN = 'at',
  REFRESH_TOKEN = 'rt',
  AUTH_HINT = 'ah',
  PASSKEY_AUTHENTICATION_ATTEMPT = 'pkai',
  TRUSTED_BROWSER_TOKEN = 'tbt',
  LOCALE = 'locale',
  POINTS_TURNSTILE = 'ptt',
}

export enum LocalStorageKey {
  // zustand
  RECENT_SEARCHES = 'recent-searches',
  RECENT_SEARCHES_ENABLED = 'recent-searches-enabled',
  THEME = 'theme',
  CHAT_WEBLLM_SETTINGS = 'chat/webllm-settings',
  BBATON_ADULT_VERIFICATION_SIGNAL = 'bbaton/adult-verification/signal',
  USER_SETTINGS_SIGNAL = 'user-settings/signal',
}

export enum SearchParamKey {
  REDIRECT = 'redirect',
}

export enum SessionStorageKey {
  // zustand
}

export const SessionStorageKeyMap = {
  readingHistory: () => 'reading-history',
}
