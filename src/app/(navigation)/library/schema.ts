import 'server-only'
import z from 'zod'

import { MAX_LIBRARY_DESCRIPTION_LENGTH, MAX_LIBRARY_NAME_LENGTH, MAX_MANGA_ID } from '@/constants/policy'

const positiveIntegerSchema = z.coerce.number().int().positive()
const mangaIdSchema = z.coerce.number().int().positive().max(MAX_MANGA_ID)

const mangaIdsArraySchema = z
  .array(mangaIdSchema)
  .min(1, '선택한 작품이 없어요')
  .max(100, '최대 100개까지 선택할 수 있어요')

export const createLibrarySchema = z.object({
  name: z
    .string()
    .min(1, '서재 이름을 입력해주세요')
    .max(MAX_LIBRARY_NAME_LENGTH, `이름은 ${MAX_LIBRARY_NAME_LENGTH}자 이하여야 해요`),
  description: z
    .string()
    .max(MAX_LIBRARY_DESCRIPTION_LENGTH, `설명은 ${MAX_LIBRARY_DESCRIPTION_LENGTH}자 이하여야 해요`)
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, '올바른 색상 코드를 입력해주세요')
    .optional(),
  icon: z.string().max(4, '이모지는 하나만 입력할 수 있어요').optional(),
  isPublic: z.boolean().optional().default(false),
})

export const bulkMoveSchema = z
  .object({
    fromLibraryId: positiveIntegerSchema,
    toLibraryId: positiveIntegerSchema,
    mangaIds: mangaIdsArraySchema,
  })
  .refine((data) => data.fromLibraryId !== data.toLibraryId, {
    error: '같은 서재로는 이동할 수 없어요',
    path: ['toLibraryId'],
  })

export const bulkCopySchema = z.object({
  toLibraryId: positiveIntegerSchema,
  mangaIds: mangaIdsArraySchema,
})

export const bulkRemoveSchema = z.object({
  libraryId: positiveIntegerSchema,
  mangaIds: mangaIdsArraySchema,
})

export const bulkImportMangaSchema = z.object({
  libraryId: positiveIntegerSchema,
  mangaIds: mangaIdsArraySchema,
})

export const addMangaToLibrariesSchema = z.object({
  mangaId: mangaIdSchema,
  libraryIds: z
    .array(positiveIntegerSchema)
    .min(1, '서재를 선택해주세요')
    .max(20, '최대 20개 서재까지 선택할 수 있어요'),
})

export const updateLibrarySchema = z.object({
  libraryId: positiveIntegerSchema,
  name: z
    .string()
    .min(1, '서재 이름을 입력해주세요')
    .max(MAX_LIBRARY_NAME_LENGTH, `이름은 ${MAX_LIBRARY_NAME_LENGTH}자 이하여야 해요`),
  description: z
    .string()
    .max(MAX_LIBRARY_DESCRIPTION_LENGTH, `설명은 ${MAX_LIBRARY_DESCRIPTION_LENGTH}자 이하여야 해요`)
    .nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, '올바른 색상 코드를 입력해주세요')
    .nullable(),
  icon: z.string().max(4, '이모지는 하나만 입력할 수 있어요').nullable(),
  isPublic: z.boolean().optional().default(false),
})
