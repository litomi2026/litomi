import { CollectionItemSort } from '@litomi/domain/library/sort'

export const COLLECTION_ITEM_SORT_OPTIONS = [
  { value: CollectionItemSort.CREATED_DESC, labelKey: 'createdDesc' },
  { value: CollectionItemSort.CREATED_ASC, labelKey: 'createdAsc' },
  { value: CollectionItemSort.MANGA_ID_DESC, labelKey: 'mangaIdDesc' },
  { value: CollectionItemSort.MANGA_ID_ASC, labelKey: 'mangaIdAsc' },
] as const
