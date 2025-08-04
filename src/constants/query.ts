export const QueryKeys = {
  me: ['me'],
  bookmarks: ['me', 'bookmarks'],
  infiniteBookmarks: ['me', 'bookmarks', 'infinite'],
  infiniteCensorships: ['me', 'censorships', 'infinite'],
  censorships: ['me', 'censorships'],
  passkeys: ['me', 'passkeys'],
  notificationUnreadCount: ['me', 'notifications', 'unread-count'],
  notifications: (searchParams: URLSearchParams) => ['me', 'notifications', Object.fromEntries(searchParams)],

  infiniteManga: ['infinite', 'manga'],
  search: (searchParams: URLSearchParams) => ['search', Object.fromEntries(searchParams)],
  searchSuggestions: (query: string, locale: string) => ['search', 'suggestions', locale, query],
}
