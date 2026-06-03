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
import { MAX_MANGA_ID } from '@litomi/domain/manga/policy'
import { POINT_CONSTANTS } from '@litomi/domain/points/model'
import { isSingleEmoji } from '@litomi/domain/utils/emoji'
import { z } from 'zod'

import { catalogMangaSchema } from '../catalog/manga'

const positiveIntegerParamSchema = z.coerce.number().int().positive()

export const libraryIdParamSchema = z.object({
  id: positiveIntegerParamSchema,
})

export type LibraryIdParam = z.infer<typeof libraryIdParamSchema>

export const libraryIconSchema = z
  .string()
  .trim()
  .max(MAX_LIBRARY_ICON_LENGTH, '이모지는 하나만 입력할 수 있어요')
  .refine(isSingleEmoji, '이모지는 하나만 입력할 수 있어요')
  .nullable()
  .optional()

export const libraryMutationBodySchema = z.object({
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

export const libraryListItemSchema = z.object({
  id: z.number(),
  userId: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  color: z.string().nullable(),
  icon: z.string().nullable(),
  isPublic: z.boolean(),
  createdAt: z.number(),
  itemCount: z.number(),
})

export type LibraryListItem = z.infer<typeof libraryListItemSchema>

export const getV1LibraryListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(LIBRARIES_PER_PAGE).default(LIBRARIES_PER_PAGE),
  scope: z.enum(['all', 'me', 'public', 'pinned']),
})

export type GETV1LibraryListQuery = z.infer<typeof getV1LibraryListQuerySchema>

export const getV1LibraryListResponseSchema = z.object({
  libraries: z.array(libraryListItemSchema),
  nextCursor: z.string().nullable(),
})

export type GETV1LibraryListResponse = z.infer<typeof getV1LibraryListResponseSchema>

export const getV1LibraryResponseSchema = libraryListItemSchema

export type GETV1LibraryResponse = z.infer<typeof getV1LibraryResponseSchema>

export const getV1LibraryIdQuerySchema = z.object({
  scope: z.enum(['public', 'me']),
})

export type GETV1LibraryIdQuery = z.infer<typeof getV1LibraryIdQuerySchema>

export const postV1LibraryBodySchema = libraryMutationBodySchema

export type POSTV1LibraryBody = z.infer<typeof postV1LibraryBodySchema>

export const postV1LibraryResponseSchema = z.object({
  id: z.number(),
  createdAt: z.number(),
})

export type POSTV1LibraryResponse = z.infer<typeof postV1LibraryResponseSchema>

export const patchV1LibraryIdBodySchema = libraryMutationBodySchema

export type PATCHV1LibraryIdBody = z.infer<typeof patchV1LibraryIdBodySchema>

export const patchV1LibraryIdResponseSchema = z.object({
  id: z.number(),
})

export type PATCHV1LibraryIdResponse = z.infer<typeof patchV1LibraryIdResponseSchema>

export const deleteV1LibraryIdResponseSchema = z.object({
  id: z.number(),
})

export type DELETEV1LibraryIdResponse = z.infer<typeof deleteV1LibraryIdResponseSchema>

export const getLibraryItemsResponseSchema = z.object({
  items: z.array(z.object({ mangaId: z.number(), createdAt: z.number(), manga: catalogMangaSchema.optional() })),
  nextCursor: z.string().nullable(),
})

export type GETLibraryItemsResponse = z.infer<typeof getLibraryItemsResponseSchema>

export const getLibraryItemsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(LIBRARY_ITEMS_PER_PAGE).default(LIBRARY_ITEMS_PER_PAGE),
  locale: z.enum(Locale),
  scope: z.enum(['public', 'me']),
  sort: z.enum(LibraryItemSort).default(DEFAULT_LIBRARY_ITEM_SORT),
})

export type GETLibraryItemsQuery = z.infer<typeof getLibraryItemsQuerySchema>

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

export type GETV1ReadingHistoryQuery = z.infer<typeof getV1ReadingHistoryQuerySchema>

export const readingHistoryItemSchema = z.object({
  mangaId: z.number(),
  lastPage: z.number(),
  updatedAt: z.number(),
  manga: catalogMangaSchema.optional(),
})

export type ReadingHistoryItem = z.infer<typeof readingHistoryItemSchema>

export const getV1ReadingHistoryResponseSchema = z.object({
  items: z.array(readingHistoryItemSchema),
  nextCursor: z.string().nullable(),
})

export type GETV1ReadingHistoryResponse = z.infer<typeof getV1ReadingHistoryResponseSchema>

export const deleteV1ReadingHistoryBodySchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('selected'),
    mangaIds: z
      .array(z.coerce.number().int().positive().max(MAX_MANGA_ID))
      .min(1)
      .max(POINT_CONSTANTS.HISTORY_MAX_EXPANSION),
  }),
  z.object({ mode: z.literal('all') }),
])

export type DELETEV1ReadingHistoryBody = z.infer<typeof deleteV1ReadingHistoryBodySchema>

export const deleteV1ReadingHistoryResponseSchema = z.object({
  deletedCount: z.number(),
})

export type DELETEV1ReadingHistoryResponse = z.infer<typeof deleteV1ReadingHistoryResponseSchema>

const positiveIntegerSchema = z.number().int().positive()
const mangaIdSchema = positiveIntegerSchema.max(MAX_MANGA_ID)
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

export const postV1LibraryItemAddResponseSchema = z.object({
  addedCount: z.number(),
})

export type POSTV1LibraryItemAddResponse = z.infer<typeof postV1LibraryItemAddResponseSchema>

export const postV1LibraryItemCopyBodySchema = z.object({
  toLibraryId: positiveIntegerSchema,
  mangaIds: mangaIdsArraySchema,
})

export type POSTV1LibraryItemCopyBody = z.infer<typeof postV1LibraryItemCopyBodySchema>

export const postV1LibraryItemCopyResponseSchema = z.object({
  copiedCount: z.number(),
})

export type POSTV1LibraryItemCopyResponse = z.infer<typeof postV1LibraryItemCopyResponseSchema>

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

export const postV1LibraryItemMoveResponseSchema = z.object({
  movedCount: z.number(),
})

export type POSTV1LibraryItemMoveResponse = z.infer<typeof postV1LibraryItemMoveResponseSchema>

export const deleteV1LibraryItemBodySchema = z.object({
  libraryId: positiveIntegerSchema,
  mangaIds: mangaIdsArraySchema,
})

export type DELETEV1LibraryItemBody = z.infer<typeof deleteV1LibraryItemBodySchema>

export const deleteV1LibraryItemResponseSchema = z.object({
  removedCount: z.number(),
})

export type DELETEV1LibraryItemResponse = z.infer<typeof deleteV1LibraryItemResponseSchema>

export const libraryMangaItemSchema = z.object({
  mangaId: z.number(),
  createdAt: z.number(),
  manga: catalogMangaSchema.optional(),
  library: z.object({
    id: z.number(),
    name: z.string(),
    color: z.string().nullable(),
    icon: z.string().nullable(),
  }),
})

export type LibraryMangaItem = z.infer<typeof libraryMangaItemSchema>

export const getV1LibraryMangaResponseSchema = z.object({
  items: z.array(libraryMangaItemSchema),
  nextCursor: z.string().nullable(),
})

export type GETV1LibraryMangaResponse = z.infer<typeof getV1LibraryMangaResponseSchema>

export const getV1LibraryMangaQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(LIBRARY_ITEMS_PER_PAGE).default(LIBRARY_ITEMS_PER_PAGE),
  locale: z.enum(Locale),
})

export type GETV1LibraryMangaQuery = z.infer<typeof getV1LibraryMangaQuerySchema>

export const ratingItemSchema = z.object({
  createdAt: z.number(),
  mangaId: z.number(),
  manga: catalogMangaSchema.optional(),
  rating: z.number(),
  updatedAt: z.number(),
})

export type RatingItem = z.infer<typeof ratingItemSchema>

export const getV1RatingsResponseSchema = z.object({
  items: z.array(ratingItemSchema),
  nextCursor: z.string().nullable(),
})

export type GETV1RatingsResponse = z.infer<typeof getV1RatingsResponseSchema>

export const getV1RatingsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(RATING_PER_PAGE).default(RATING_PER_PAGE),
  locale: z.enum(Locale),
  sort: z.enum(RatingSort).default(RatingSort.UPDATED_DESC),
})

export type GETV1RatingsQuery = z.infer<typeof getV1RatingsQuerySchema>

export const deleteV1LibraryRatingBodySchema = z.object({
  mangaIds: z.array(z.coerce.number().int().positive()).min(1).max(100),
})

export type DELETEV1LibraryRatingBody = z.infer<typeof deleteV1LibraryRatingBodySchema>

export const deleteV1LibraryRatingResponseSchema = z.object({
  deletedCount: z.number(),
})

export type DELETEV1LibraryRatingResponse = z.infer<typeof deleteV1LibraryRatingResponseSchema>

export const getV1LibrarySummaryResponseSchema = z.object({
  bookmarkCount: z.number(),
  historyCount: z.number(),
  ratingCount: z.number(),
})

export type GETV1LibrarySummaryResponse = z.infer<typeof getV1LibrarySummaryResponseSchema>

export const postV1LibraryHistoryImportBodySchema = z.object({
  localHistories: z
    .array(
      z.object({
        mangaId: z.coerce.number().int().positive().max(MAX_MANGA_ID),
        lastPage: z.coerce.number().int().positive().max(MAX_READING_HISTORY_LAST_PAGE),
        updatedAt: z.coerce.number().int().positive(),
      }),
    )
    .min(1)
    .max(100),
})

export type POSTV1LibraryHistoryImportBody = z.infer<typeof postV1LibraryHistoryImportBodySchema>

export const postV1LibraryHistoryImportResponseSchema = z.object({
  importedCount: z.number(),
  skippedCount: z.number(),
  synced: z.boolean(),
})

export type POSTV1LibraryHistoryImportResponse = z.infer<typeof postV1LibraryHistoryImportResponseSchema>
