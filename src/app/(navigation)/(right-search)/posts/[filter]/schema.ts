import 'server-only'
import { z } from 'zod'

export enum PostFilterParams {
  FOLLOWING = 'following',
  RECOMMAND = 'recommand',
}

export const postFilterSchema = z.object({
  filter: z.enum(PostFilterParams),
})
