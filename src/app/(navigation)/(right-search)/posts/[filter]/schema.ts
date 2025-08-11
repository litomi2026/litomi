import { z } from 'zod/v4'

export enum PostFilterParams {
  Following = 'following',
  Recommand = 'recommand',
}

export const postFilterSchema = z.object({
  filter: z.enum(PostFilterParams),
})
