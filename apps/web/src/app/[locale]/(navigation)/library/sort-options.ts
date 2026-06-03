import { LibraryItemSort } from '@litomi/domain/library/sort'

export const LIBRARY_ITEM_SORT_OPTIONS = [
  { value: LibraryItemSort.CREATED_DESC, labelKey: 'createdDesc' },
  { value: LibraryItemSort.CREATED_ASC, labelKey: 'createdAsc' },
  { value: LibraryItemSort.MANGA_ID_DESC, labelKey: 'mangaIdDesc' },
  { value: LibraryItemSort.MANGA_ID_ASC, labelKey: 'mangaIdAsc' },
] as const
