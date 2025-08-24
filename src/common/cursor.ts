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
