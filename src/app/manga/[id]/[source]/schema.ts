import { z } from 'zod/v4'

import { SourceParam } from '@/utils/param'

export const mangaSchema = z.object({
  id: z.coerce.number().int().positive(),
  source: z.enum(SourceParam),
})
