import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { zProblemValidator } from '@/backend/utils/validator'
import { ReferredPost } from '@/components/post/ReferredPostCard'
import { POST_PER_PAGE } from '@/constants/policy'
import selectPosts from '@/sql/selectPosts'
import { createCacheControl } from '@/utils/cache-control'
import { sec } from '@/utils/format/date'

import { PostFilter } from './constant'

const querySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(POST_PER_PAGE).default(POST_PER_PAGE),
  mangaId: z.coerce.number().int().positive().optional(),
  filter: z.enum(PostFilter).optional(),
  username: z.string().min(1).max(32).optional(),
})

export type GETV1PostResponse = {
  posts: Post[]
  nextCursor: number | null
}

export type Post = {
  id: number
  createdAt: Date
  content: string | null
  author: {
    id: number
    name: string
    nickname: string
    imageURL: string | null
  } | null
  mangaId: number | null
  likeCount: number
  commentCount: number
  repostCount: number
  viewCount?: number
  referredPost: ReferredPost | null
}

const postRoutes = new Hono<Env>()

postRoutes.get('/', zProblemValidator('query', querySchema), async (c) => {
  const { cursor, limit, mangaId, filter, username } = c.req.valid('query')
  const currentUserId = c.get('userId')

  const postRows = await selectPosts({
    limit: limit + 1,
    cursor,
    mangaId,
    filter,
    username,
    currentUserId,
  })

  const cacheControl = cursor
    ? createCacheControl({
        private: true,
        maxAge: sec('1 hour'),
      })
    : createCacheControl({
        private: true,
        maxAge: 3,
      })

  const hasNextPage = postRows.length > limit
  const posts = hasNextPage ? postRows.slice(0, limit) : postRows
  const lastPost = posts[posts.length - 1]
  const nextCursor = hasNextPage ? lastPost.id : null

  return c.json<GETV1PostResponse>({ posts, nextCursor }, { headers: { 'Cache-Control': cacheControl } })
})

export default postRoutes
