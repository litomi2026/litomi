import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

import { Env } from '@/backend'
import { getUserId } from '@/backend/utils/auth'
import { ReferredPost } from '@/components/post/ReferredPostCard'
import { POST_PER_PAGE } from '@/constants/policy'
import { createCacheControl } from '@/crawler/proxy-utils'
import selectPosts from '@/sql/selectPosts'
import { sec } from '@/utils/date'

export enum PostFilter {
  FOLLOWING = '0',
  MANGA = '1',
  RECOMMAND = '2',
  USER = '3',
}

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

postRoutes.get('/', zValidator('query', querySchema), async (c) => {
  const { cursor, limit, mangaId, filter, username } = c.req.valid('query')
  const currentUserId = getUserId()

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
