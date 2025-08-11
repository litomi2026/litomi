import { z } from 'zod/v4'

export enum PostFilter {
  All = 'all',
  Following = 'following',
  Recommand = 'recommand',
  Manga = 'manga',
}

export const postFilterSchema = z.object({
  filter: z.enum(PostFilter),
})
