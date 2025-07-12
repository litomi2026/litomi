export const QueryKeys = {
  me: ['me'],
  manga: (mangaId: number) => ['manga', mangaId],
  infiniteManga: ['infinite', 'manga'],
  bookmarks: ['me', 'bookmarks'],
  infiniteBookmarks: ['infinite', 'bookmarks'],
  bookmark: (mangaId: number) => ['me', 'bookmark', mangaId],
  search: (searchParams: URLSearchParams) => ['search', Object.fromEntries(searchParams)],
}
