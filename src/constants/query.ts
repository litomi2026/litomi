export const QueryKeys = {
  me: ['me'],
  manga: (mangaId: number) => ['manga', mangaId],
  infiniteManga: ['infinite', 'manga'],
  search: (searchParams: URLSearchParams) => ['search', Object.fromEntries(searchParams)],
  bookmarks: ['me', 'bookmarks'],
  infiniteBookmarks: ['me', 'infinite', 'bookmarks'],
  bookmark: (mangaId: number) => ['me', 'bookmark', mangaId],
  searchSuggestions: (query: string, locale: string) => ['search', 'suggestions', locale, query],
}
