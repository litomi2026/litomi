export const QueryKeys = {
  me: ['me'],
  bookmarks: ['me', 'bookmarks'],
  infiniteBookmarks: ['me', 'bookmarks', 'infinite'],

  infiniteManga: ['infinite', 'manga'],
  search: (searchParams: URLSearchParams) => ['search', Object.fromEntries(searchParams)],
  searchSuggestions: (query: string, locale: string) => ['search', 'suggestions', locale, query],
}
