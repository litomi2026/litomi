import { MAX_READING_HISTORY_LAST_PAGE } from '@litomi/domain/library/policy'
import { z } from 'zod'

export type GETV1MangaIdHistoryResponse = number

export const postV1MangaIdHistoryBodySchema = z.object({
  lastPage: z.coerce.number().int().positive().max(MAX_READING_HISTORY_LAST_PAGE),
})

export type POSTV1MangaIdHistoryBody = z.infer<typeof postV1MangaIdHistoryBodySchema>

export type GETV1MangaIdRatingResponse = { rating: number; updatedAt: number } | null

export const putV1MangaIdRatingRequestSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
})

export interface PUTV1MangaIdRatingResponse {
  rating: number
  updatedAt: number
}

export enum MangaReportReason {
  DEEPFAKE = 'DEEPFAKE',
  REAL_PERSON_MINOR = 'REAL_PERSON_MINOR',
}

const mangaReportReasonSchema = z.enum(MangaReportReason)

export const postV1MangaIdReportBodySchema = z.object({
  reason: mangaReportReasonSchema,
})

export type POSTV1MangaIdReportBody = z.infer<typeof postV1MangaIdReportBodySchema>

export interface POSTV1MangaIdReportResponse {
  accepted: boolean
  duplicated: boolean
}

export interface GETV1MangaIdReportResponse {
  alreadyReported: boolean
}
