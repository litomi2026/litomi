import { z } from 'zod/v4'

import { SortParam, SourceParam, ViewCookie } from '@/utils/param'

export const mangasSchema = z.object({
  source: z.enum(SourceParam),
  page: z.coerce.number().int().positive(),
  sort: z.enum(SortParam),
  layout: z.enum(ViewCookie),
})
