import { z } from 'zod/v4'

import { SourceParam, ViewCookie } from '@/utils/param'

export const mangasSchema = z.object({
  source: z.enum(SourceParam),
  page: z.coerce.number().int().positive(),
  layout: z.enum(ViewCookie),
})
