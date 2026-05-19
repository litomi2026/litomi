import { CollectionItemSort } from '@litomi/domain/library/sort'

export const COLLECTION_ITEM_SORT_OPTIONS = [
  { value: CollectionItemSort.CREATED_DESC, label: '최근 추가순' },
  { value: CollectionItemSort.CREATED_ASC, label: '오래된순' },
  { value: CollectionItemSort.MANGA_ID_DESC, label: '작품 ID 높은순' },
  { value: CollectionItemSort.MANGA_ID_ASC, label: '작품 ID 낮은순' },
] as const
