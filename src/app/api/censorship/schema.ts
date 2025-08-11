import { z } from 'zod/v4'

export const GETCensorshipsSchema = z.object({
  cursorId: z.coerce.number().int().positive().optional(),
  cursorTime: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(1000).default(1000),
})

export type GETCensorshipsRequest = z.infer<typeof GETCensorshipsSchema>
