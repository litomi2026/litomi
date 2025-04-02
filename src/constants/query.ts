export const QueryKeys = {
  me: ['me'],
  bookmarks: ['me', 'bookmarks'],
  bookmark: (mangaId: number) => ['me', 'bookmark', mangaId],
}
