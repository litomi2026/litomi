import { z } from 'zod/v4'

export enum PostFilter {
  FOLLOWING,
  MANGA,
  RECOMMAND,
}

export const GETPostSchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  mangaId: z.coerce.number().int().positive().optional(),
  filter: z.enum(PostFilter).optional(),
  userId: z.coerce.number().int().positive().optional(),
})

export type GETPostRequest = z.infer<typeof GETPostSchema>
