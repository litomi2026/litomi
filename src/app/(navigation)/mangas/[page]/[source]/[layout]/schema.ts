import { z } from 'zod/v4'

import { ViewCookie } from '@/utils/param'

export const mangasSchema = z.object({
  page: z.coerce.number().int().positive(),
  layout: z.enum(ViewCookie),
})
