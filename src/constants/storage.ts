export enum CookieKey {
  ACCESS_TOKEN = 'at',
  REFRESH_TOKEN = 'rt',
  TRUSTED_BROWSER_TOKEN = 'tbt',
  LOCALE = 'locale',
}

export enum LocalStorageKey {
  // zustand
  CONTROLLER_SCREEN_FIT = 'controller/screen-fit',
  CONTROLLER_NAVIGATION_MODE = 'controller/navigation-mode',
  CONTROLLER_TOUCH_ORIENTATION = 'controller/touch-orientation',
  CONTROLLER_PAGE_VIEW = 'controller/page-view',
  CONTROLLER_IMAGE_WIDTH = 'controller/image-width',
  CONTROLLER_READING_DIRECTION = 'controller/reading-direction',
  RECENT_SEARCHES = 'recent-searches',
  RECENT_SEARCHES_ENABLED = 'recent-searches-enabled',
  THEME = 'theme',
}

export enum SearchParamKey {
  REDIRECT = 'redirect',
}

export enum SessionStorageKey {
  // zustand
  CONTROLLER_BRIGHTNESS = 'controller/brightness',
}

export const SessionStorageKeyMap = {
  readingHistory: (mangaId: number) => `reading-history-${mangaId}`,
}
