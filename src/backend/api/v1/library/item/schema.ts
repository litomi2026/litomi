import { z } from 'zod'

import { MAX_MANGA_ID } from '@/constants/policy'

const positiveIntegerSchema = z.coerce.number().int().positive()
const mangaIdSchema = z.coerce.number().int().positive().max(MAX_MANGA_ID)

const mangaIdsArraySchema = z
  .array(mangaIdSchema)
  .min(1, '선택한 작품이 없어요')
  .max(100, '최대 100개까지 선택할 수 있어요')

export const addItemBodySchema = z.object({
  mangaId: mangaIdSchema,
  libraryIds: z
    .array(positiveIntegerSchema)
    .min(1, '서재를 선택해 주세요')
    .max(20, '최대 20개 서재까지 선택할 수 있어요'),
})

export const copyItemBodySchema = z.object({
  toLibraryId: positiveIntegerSchema,
  mangaIds: mangaIdsArraySchema,
})

export const moveItemBodySchema = z
  .object({
    fromLibraryId: positiveIntegerSchema,
    toLibraryId: positiveIntegerSchema,
    mangaIds: mangaIdsArraySchema,
  })
  .refine((data) => data.fromLibraryId !== data.toLibraryId, {
    error: '같은 서재로는 이동할 수 없어요',
    path: ['toLibraryId'],
  })

export const deleteItemBodySchema = z.object({
  libraryId: positiveIntegerSchema,
  mangaIds: mangaIdsArraySchema,
})

export const LibraryItemError = {
  LIBRARY_FULL: 'LIBRARY_FULL',
  NOT_FOUND: 'NOT_FOUND',
  NO_MOVABLE_ITEMS: 'NO_MOVABLE_ITEMS',
  NO_NEW_MANGA: 'NO_NEW_MANGA',
  NO_SOURCE_ITEMS: 'NO_SOURCE_ITEMS',
  NO_VALID_LIBRARIES: 'NO_VALID_LIBRARIES',
} as const

export type DELETEV1LibraryItemBody = z.infer<typeof deleteItemBodySchema>
export type DELETEV1LibraryItemResponse = { removedCount: number }
export type POSTV1LibraryItemAddBody = z.infer<typeof addItemBodySchema>
export type POSTV1LibraryItemAddResponse = { addedCount: number }
export type POSTV1LibraryItemCopyBody = z.infer<typeof copyItemBodySchema>
export type POSTV1LibraryItemCopyResponse = { copiedCount: number }
export type POSTV1LibraryItemMoveBody = z.infer<typeof moveItemBodySchema>
export type POSTV1LibraryItemMoveResponse = { movedCount: number }
