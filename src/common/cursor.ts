import 'server-only'
import { z } from 'zod'

const DefaultCursorSchema = z.object({
  timestamp: z.coerce.number().int().positive(),
  mangaId: z.coerce.number().int().positive(),
})

const RatingCursorSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  timestamp: z.coerce.number().int().positive(),
  mangaId: z.coerce.number().int().positive(),
})

const CensorshipCursorSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export function decodeBookmarkCursor(cursor: string) {
  const [timestamp, mangaId] = cursor.split('-')

  const validation = DefaultCursorSchema.safeParse({
    timestamp,
    mangaId,
  })

  if (!validation.success) {
    return null
  }

  return validation.data
}

export function decodeCensorshipCursor(cursor: string) {
  const validation = CensorshipCursorSchema.safeParse({
    id: cursor,
  })

  if (!validation.success) {
    return null
  }

  return validation.data
}

export function decodeLibraryIdCursor(cursor: string) {
  const [timestamp, mangaId] = cursor.split('-')

  const validation = DefaultCursorSchema.safeParse({
    timestamp,
    mangaId,
  })

  if (!validation.success) {
    return null
  }

  return validation.data
}

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

export function encodeBookmarkCursor(timestamp: number, mangaId: number) {
  return `${timestamp}-${mangaId}`
}

export function encodeCensorshipCursor(id: number) {
  return id.toString()
}

export function encodeLibraryIdCursor(timestamp: number, mangaId: number) {
  return `${timestamp}-${mangaId}`
}

export function encodeRatingCursor(rating: number, timestamp: number, mangaId: number) {
  return `${rating}-${timestamp}-${mangaId}`
}
