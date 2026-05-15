import { MAX_BOOKMARK_BATCH_SIZE, MAX_MANGA_ID } from '@litomi/domain/constants/policy'
import { z } from 'zod'

const mangaIdSchema = z.coerce.number().int().positive().max(MAX_MANGA_ID)

export const bookmarkSchema = z.object({
  mangaId: z.number(),
  createdAt: z.number(),
})

export type Bookmark = z.infer<typeof bookmarkSchema>

export const getV1BookmarkResponseSchema = z.object({
  bookmarks: z.array(bookmarkSchema),
  nextCursor: z.string().nullable(),
})

export type GETV1BookmarkResponse = z.infer<typeof getV1BookmarkResponseSchema>

export const postV1BookmarkBodySchema = z.object({
  mangaIds: z.array(mangaIdSchema).min(1).max(MAX_BOOKMARK_BATCH_SIZE),
})

export type POSTV1BookmarkBody = z.infer<typeof postV1BookmarkBodySchema>

export const postV1BookmarkResponseSchema = z.object({
  createdMangaIds: z.array(z.number()),
  duplicateCount: z.number(),
  overflowCount: z.number(),
})

export type POSTV1BookmarkResponse = z.infer<typeof postV1BookmarkResponseSchema>

export const deleteV1BookmarkBodySchema = z.object({
  mangaIds: z.array(mangaIdSchema).min(1).max(MAX_BOOKMARK_BATCH_SIZE),
})

export type DELETEV1BookmarkBody = z.infer<typeof deleteV1BookmarkBodySchema>

export const deleteV1BookmarkResponseSchema = z.object({
  deletedCount: z.number(),
})

export type DELETEV1BookmarkResponse = z.infer<typeof deleteV1BookmarkResponseSchema>

export const putV1BookmarkIdResponseSchema = z.object({
  mangaId: z.number(),
  createdAt: z.number(),
})

export type PUTV1BookmarkIdResponse = z.infer<typeof putV1BookmarkIdResponseSchema>

export const getV1BookmarkIdResponseSchema = z.object({
  mangaIds: z.array(z.number()),
})

export type GETV1BookmarkIdResponse = z.infer<typeof getV1BookmarkIdResponseSchema>

export const exportBookmarkSchema = bookmarkSchema

export type ExportBookmark = z.infer<typeof exportBookmarkSchema>

export const getV1BookmarkExportResponseSchema = z.object({
  bookmarks: z.array(exportBookmarkSchema),
})

export type GETV1BookmarkExportResponse = z.infer<typeof getV1BookmarkExportResponseSchema>

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

export type POSTV1BookmarkImportBody = z.infer<typeof postV1BookmarkImportBodySchema>

export const postV1BookmarkImportResponseSchema = z.object({
  imported: z.number(),
  skipped: z.number(),
})

export type POSTV1BookmarkImportResponse = z.infer<typeof postV1BookmarkImportResponseSchema>
