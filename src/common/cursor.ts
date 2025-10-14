import { z } from 'zod/v4'

const CursorSchema = z.object({
  timestamp: z.coerce.number().int().positive(),
  mangaId: z.coerce.number().int().positive(),
})

export function decodeLibraryIdCursor(cursor: string) {
  const [timestamp, mangaId] = cursor.split('-')

  const validation = CursorSchema.safeParse({
    timestamp,
    mangaId,
  })

  if (!validation.success) {
    return null
  }

  return validation.data
}

export function encodeLibraryIdCursor(timestamp: number, mangaId: number) {
  return `${timestamp}-${mangaId}`
}

const BookmarkCursorSchema = z.object({
  timestamp: z.coerce.number().int().positive(),
  mangaId: z.coerce.number().int().positive(),
})

export function decodeBookmarkCursor(cursor: string) {
  const [timestamp, mangaId] = cursor.split('-')

  const validation = BookmarkCursorSchema.safeParse({
    timestamp,
    mangaId,
  })

  if (!validation.success) {
    return null
  }

  return validation.data
}

export function encodeBookmarkCursor(timestamp: number, mangaId: number) {
  return `${timestamp}-${mangaId}`
}

const RatingCursorSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  timestamp: z.coerce.number().int().positive(),
  mangaId: z.coerce.number().int().positive(),
})

export function decodeRatingCursor(cursor: string) {
  const [rating, timestamp, mangaId] = cursor.split('-')

  const validation = RatingCursorSchema.safeParse({
    rating,
    timestamp,
    mangaId,
  })

  if (!validation.success) {
    return null
  }

  return validation.data
}

export function encodeRatingCursor(rating: number, timestamp: number, mangaId: number) {
  return `${rating}-${timestamp}-${mangaId}`
}
