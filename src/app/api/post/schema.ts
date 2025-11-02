import 'server-only'
import { z } from 'zod'

import { PostFilter } from './types'

export const GETPostSchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  mangaId: z.coerce.number().int().positive().optional(),
  filter: z.enum(PostFilter).optional(),
  username: z.string().min(1).max(32).optional(),
})

export type GETPostRequest = z.infer<typeof GETPostSchema>
