import { z } from 'zod/v4'

export const mangaSchema = z.object({
  id: z.coerce.number().int().positive(),
})
