import { MAX_MANGA_ID, MAX_READING_HISTORY_LAST_PAGE } from '@litomi/domain/constants/policy'
import { z } from 'zod'

export const getV1MangaIdHistoryResponseSchema = z.number()

export type GETV1MangaIdHistoryResponse = z.infer<typeof getV1MangaIdHistoryResponseSchema>

export const postV1MangaIdHistoryBodySchema = z.object({
  lastPage: z.coerce.number().int().positive().max(MAX_READING_HISTORY_LAST_PAGE),
})

export type POSTV1MangaIdHistoryBody = z.infer<typeof postV1MangaIdHistoryBodySchema>

export const getV1MangaIdRatingResponseSchema = z
  .object({
    rating: z.number(),
    updatedAt: z.number(),
  })
  .nullable()

export type GETV1MangaIdRatingResponse = z.infer<typeof getV1MangaIdRatingResponseSchema>

export const putV1MangaIdRatingRequestSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
})

export type PUTV1MangaIdRatingRequest = z.infer<typeof putV1MangaIdRatingRequestSchema>

export const putV1MangaIdRatingResponseSchema = z.object({
  rating: z.number(),
  updatedAt: z.number(),
})

export type PUTV1MangaIdRatingResponse = z.infer<typeof putV1MangaIdRatingResponseSchema>

export const MangaReportReason = {
  DEEPFAKE: 'DEEPFAKE',
  REAL_PERSON_MINOR: 'REAL_PERSON_MINOR',
} as const

export const mangaReportReasonSchema = z.union([
  z.literal(MangaReportReason.DEEPFAKE),
  z.literal(MangaReportReason.REAL_PERSON_MINOR),
])

export const postV1MangaIdReportBodySchema = z.object({
  reason: mangaReportReasonSchema,
})

export type POSTV1MangaIdReportBody = z.infer<typeof postV1MangaIdReportBodySchema>

export const postV1MangaIdReportResponseSchema = z.object({
  accepted: z.boolean(),
  duplicated: z.boolean(),
})

export type POSTV1MangaIdReportResponse = z.infer<typeof postV1MangaIdReportResponseSchema>

export const mangaIdParamSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
})
