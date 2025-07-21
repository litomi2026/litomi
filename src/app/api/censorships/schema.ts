import { z } from 'zod/v4'

export const GETCensorshipsSchema = z.object({
  cursorId: z.coerce.number().int().positive().optional(),
  cursorTime: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
})

export type GETCensorshipsRequest = z.infer<typeof GETCensorshipsSchema>
