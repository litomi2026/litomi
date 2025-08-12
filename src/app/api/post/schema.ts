import { z } from 'zod/v4'

export enum PostFilter {
  FOLLOWING = '0',
  MANGA = '1',
  RECOMMAND = '2',
  USER = '3',
}

export const GETPostSchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  mangaId: z.coerce.number().int().positive().optional(),
  filter: z.enum(PostFilter).optional(),
  username: z.string().min(1).max(32).optional(),
})

export type GETPostRequest = z.infer<typeof GETPostSchema>
