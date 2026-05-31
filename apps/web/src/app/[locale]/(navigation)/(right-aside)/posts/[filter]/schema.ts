import 'server-only'
import { z } from 'zod'

export enum PostFilterParams {
  FOLLOWING = 'following',
  RECOMMEND = 'recommend',
}

export const postFilterSchema = z.object({
  filter: z.enum(PostFilterParams),
})
