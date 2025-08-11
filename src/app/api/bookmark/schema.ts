import { z } from 'zod/v4'

export const GETBookmarksSchema = z.object({
  cursorId: z.coerce.number().int().positive().optional(),
  cursorTime: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
})

export type GETBookmarksRequest = z.infer<typeof GETBookmarksSchema>
