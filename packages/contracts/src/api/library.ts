import {
  LIBRARIES_PER_PAGE,
  LIBRARY_ITEMS_PER_PAGE,
  MAX_LIBRARY_DESCRIPTION_LENGTH,
  MAX_LIBRARY_ICON_LENGTH,
  MAX_LIBRARY_NAME_LENGTH,
  MAX_READING_HISTORY_LAST_PAGE,
  RATING_PER_PAGE,
  READING_HISTORY_PER_PAGE,
} from '@litomi/domain/library/policy'
import { DEFAULT_LIBRARY_ITEM_SORT, LibraryItemSort, RatingSort } from '@litomi/domain/library/sort'
import { Locale } from '@litomi/domain/locale'
import { POINT_CONSTANTS } from '@litomi/domain/points/model'
import { isSingleEmoji } from '@litomi/domain/utils/emoji'
import { z } from 'zod'

import type { CatalogManga } from '../catalog/manga'
import { mangaIdSchema } from '../shared'

const libraryIconSchema = z
  .string()
  .trim()
  .max(MAX_LIBRARY_ICON_LENGTH, '이모지는 하나만 입력할 수 있어요')
  .refine(isSingleEmoji, '이모지는 하나만 입력할 수 있어요')
  .nullable()
  .optional()

const libraryMutationBodySchema = z.object({
  name: z
    .string()
    .min(1, '서재 이름을 입력해 주세요')
    .max(MAX_LIBRARY_NAME_LENGTH, `이름은 ${MAX_LIBRARY_NAME_LENGTH}자 이하여야 해요`),
  description: z
    .string()
    .max(MAX_LIBRARY_DESCRIPTION_LENGTH, `설명은 ${MAX_LIBRARY_DESCRIPTION_LENGTH}자 이하여야 해요`)
    .nullable()
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, '올바른 색상 코드를 입력해 주세요')
    .nullable()
    .optional(),
  icon: libraryIconSchema,
  isPublic: z.boolean().optional().default(false),
})

export interface LibraryListItem {
  id: number
  userId: number
  name: string
  description: string | null
  color: string | null
  icon: string | null
  isPublic: boolean
  createdAt: number
  itemCount: number
  pinCount: number
}

export const getV1LibraryListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(LIBRARIES_PER_PAGE).default(LIBRARIES_PER_PAGE),
  scope: z.enum(['all', 'me', 'public', 'pinned']),
})

export interface GETV1LibraryListResponse {
  libraries: LibraryListItem[]
  nextCursor: string | null
}

export type GETV1LibraryResponse = LibraryListItem

export const getV1LibraryIdQuerySchema = z.object({
  scope: z.enum(['public', 'me']),
})

export const postV1LibraryBodySchema = libraryMutationBodySchema

export interface POSTV1LibraryResponse {
  id: number
  createdAt: number
}

export const patchV1LibraryIdBodySchema = libraryMutationBodySchema

export type PATCHV1LibraryIdBody = z.infer<typeof patchV1LibraryIdBodySchema>

export interface PATCHV1LibraryIdResponse {
  id: number
}

export interface DELETEV1LibraryIdResponse {
  id: number
}

export interface GETV1LibraryItemsResponse {
  items: { mangaId: number; createdAt: number; manga?: CatalogManga }[]
  nextCursor: string | null
}

export const getV1LibraryItemsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(LIBRARY_ITEMS_PER_PAGE).default(LIBRARY_ITEMS_PER_PAGE),
  locale: z.enum(Locale),
  scope: z.enum(['public', 'me']),
  sort: z.enum(LibraryItemSort).default(DEFAULT_LIBRARY_ITEM_SORT),
})

export const getV1ReadingHistoryQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(POINT_CONSTANTS.HISTORY_MAX_EXPANSION)
    .default(READING_HISTORY_PER_PAGE),
  locale: z.enum(Locale),
})

export interface ReadingHistoryItem {
  mangaId: number
  lastPage: number
  updatedAt: number
  manga?: CatalogManga
}

export interface GETV1ReadingHistoryResponse {
  items: ReadingHistoryItem[]
  nextCursor: string | null
}

export const deleteV1ReadingHistoryBodySchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('selected'),
    mangaIds: z.array(mangaIdSchema).min(1).max(POINT_CONSTANTS.HISTORY_MAX_EXPANSION),
  }),
  z.object({ mode: z.literal('all') }),
])

export type DELETEV1ReadingHistoryBody = z.infer<typeof deleteV1ReadingHistoryBodySchema>

export interface DELETEV1ReadingHistoryResponse {
  deletedCount: number
}

const positiveIntegerSchema = z.number().int().positive()
const mangaIdsArraySchema = z
  .array(mangaIdSchema)
  .min(1, '선택한 작품이 없어요')
  .max(100, '최대 100개까지 선택할 수 있어요')

export const postV1LibraryItemAddBodySchema = z.object({
  mangaId: mangaIdSchema,
  libraryIds: z
    .array(positiveIntegerSchema)
    .min(1, '서재를 선택해 주세요')
    .max(20, '최대 20개 서재까지 선택할 수 있어요'),
})

export type POSTV1LibraryItemAddBody = z.infer<typeof postV1LibraryItemAddBodySchema>

export interface POSTV1LibraryItemAddResponse {
  addedCount: number
}

export const postV1LibraryItemCopyBodySchema = z.object({
  toLibraryId: positiveIntegerSchema,
  mangaIds: mangaIdsArraySchema,
})

export type POSTV1LibraryItemCopyBody = z.infer<typeof postV1LibraryItemCopyBodySchema>

export interface POSTV1LibraryItemCopyResponse {
  copiedCount: number
}

export const postV1LibraryItemMoveBodySchema = z
  .object({
    fromLibraryId: positiveIntegerSchema,
    toLibraryId: positiveIntegerSchema,
    mangaIds: mangaIdsArraySchema,
  })
  .refine((data) => data.fromLibraryId !== data.toLibraryId, {
    error: '같은 서재로는 이동할 수 없어요',
    path: ['toLibraryId'],
  })

export type POSTV1LibraryItemMoveBody = z.infer<typeof postV1LibraryItemMoveBodySchema>

export interface POSTV1LibraryItemMoveResponse {
  movedCount: number
}

export const deleteV1LibraryItemBodySchema = z.object({
  libraryId: positiveIntegerSchema,
  mangaIds: mangaIdsArraySchema,
})

export type DELETEV1LibraryItemBody = z.infer<typeof deleteV1LibraryItemBodySchema>

export interface DELETEV1LibraryItemResponse {
  removedCount: number
}

export interface LibraryMangaItem {
  mangaId: number
  createdAt: number
  manga?: CatalogManga
  library: {
    id: number
    name: string
    color: string | null
    icon: string | null
  }
}

export interface GETV1LibraryMangaResponse {
  items: LibraryMangaItem[]
  nextCursor: string | null
}

export const getV1LibraryMangaQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(LIBRARY_ITEMS_PER_PAGE).default(LIBRARY_ITEMS_PER_PAGE),
  locale: z.enum(Locale),
})

export interface RatingItem {
  createdAt: number
  mangaId: number
  manga?: CatalogManga
  rating: number
  updatedAt: number
}

export interface GETV1RatingsResponse {
  items: RatingItem[]
  nextCursor: string | null
}

export const getV1RatingsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(RATING_PER_PAGE).default(RATING_PER_PAGE),
  locale: z.enum(Locale),
  sort: z.enum(RatingSort).default(RatingSort.UPDATED_DESC),
})

export const deleteV1LibraryRatingBodySchema = z.object({
  mangaIds: z.array(z.coerce.number().int().positive()).min(1).max(100),
})

export type DELETEV1LibraryRatingBody = z.infer<typeof deleteV1LibraryRatingBodySchema>

export interface DELETEV1LibraryRatingResponse {
  deletedCount: number
}

export interface GETV1LibrarySummaryResponse {
  bookmarkCount: number
  historyCount: number
  ratingCount: number
}

export const postV1LibraryHistoryImportBodySchema = z.object({
  localHistories: z
    .array(
      z.object({
        mangaId: mangaIdSchema,
        lastPage: z.coerce.number().int().positive().max(MAX_READING_HISTORY_LAST_PAGE),
        updatedAt: z.coerce.number().int().positive(),
      }),
    )
    .min(1)
    .max(100),
})

export type POSTV1LibraryHistoryImportBody = z.infer<typeof postV1LibraryHistoryImportBodySchema>

export interface POSTV1LibraryHistoryImportResponse {
  importedCount: number
  skippedCount: number
  synced: boolean
}
