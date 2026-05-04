import { cache } from 'react'
import { z } from 'zod'
import 'server-only'

import selectPost from '@/sql/selectPost'
import selectPostComment from '@/sql/selectPostComment'

export const postParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const POST_DETAIL_COMMENTS_PREVIEW_LIMIT = 20

export const getPost = cache(async (id: number) => {
  const [post] = await selectPost({ postId: id })
  return post ?? null
})

export const getPostComment = cache(async (postId: number) => {
  return selectPostComment({ parentPostId: postId, limit: POST_DETAIL_COMMENTS_PREVIEW_LIMIT })
})
