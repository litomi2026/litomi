import { z } from 'zod/v4'

export const BookmarksQuerySchema = z.object({
  cursorId: z.coerce.number().int().positive().optional(),
  cursorTime: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
})

export type BookmarksQuery = z.infer<typeof BookmarksQuerySchema>
