import { z } from 'zod/v4'

export enum PostFilterParams {
  FOLLOWING = 'following',
  RECOMMAND = 'recommand',
}

export const postFilterSchema = z.object({
  filter: z.enum(PostFilterParams),
})
