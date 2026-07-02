import { BOOKMARKS_PER_PAGE, MAX_BOOKMARK_BATCH_SIZE } from '@litomi/domain/library/policy'
import { DEFAULT_LIBRARY_ITEM_SORT, LibraryItemSort } from '@litomi/domain/library/sort'
import { Locale } from '@litomi/domain/locale'
import { z } from 'zod'

import type { CatalogManga } from '../catalog/manga'
import { mangaIdSchema } from '../shared'

export interface Bookmark {
  mangaId: number
  createdAt: number
  manga?: CatalogManga
}

export interface GETV1BookmarkResponse {
  bookmarks: Bookmark[]
  nextCursor: string | null
}

export const getV1BookmarkQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(BOOKMARKS_PER_PAGE).default(BOOKMARKS_PER_PAGE),
  locale: z.enum(Locale),
  sort: z.enum(LibraryItemSort).default(DEFAULT_LIBRARY_ITEM_SORT),
})

export const postV1BookmarkBodySchema = z.object({
  mangaIds: z.array(mangaIdSchema).min(1).max(MAX_BOOKMARK_BATCH_SIZE),
})

export type POSTV1BookmarkBody = z.infer<typeof postV1BookmarkBodySchema>

export interface POSTV1BookmarkResponse {
  createdMangaIds: number[]
  duplicateCount: number
  overflowCount: number
}

export const deleteV1BookmarkBodySchema = z.object({
  mangaIds: z.array(mangaIdSchema).min(1).max(MAX_BOOKMARK_BATCH_SIZE),
})

export type DELETEV1BookmarkBody = z.infer<typeof deleteV1BookmarkBodySchema>

export interface DELETEV1BookmarkResponse {
  deletedCount: number
}

export interface PUTV1BookmarkIdResponse {
  mangaId: number
  createdAt: number
}

export interface GETV1BookmarkIdResponse {
  mangaIds: number[]
}

export interface GETV1BookmarkExportResponse {
  bookmarks: Bookmark[]
}

export const postV1BookmarkImportBodySchema = z.object({
  mode: z.enum(['merge', 'replace']),
  bookmarks: z
    .array(
      z.object({
        mangaId: z.number().int().positive(),
        createdAt: z.coerce.date().optional(),
      }),
    )
    .min(1),
})

export interface POSTV1BookmarkImportResponse {
  imported: number
  skipped: number
}
