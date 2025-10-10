import { z } from 'zod/v4'

export const GETBookmarksSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
})

export const cursorSchema = z.object({
  timestamp: z.coerce.number().int().positive(),
  mangaId: z.coerce.number().int().positive(),
})

export type GETBookmarksRequest = z.infer<typeof GETBookmarksSchema>
