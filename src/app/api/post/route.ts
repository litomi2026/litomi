import { ReferredPost } from '@/components/post/ReferredPostCard'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import selectPosts from '@/sql/selectPosts'
import { validateUserIdFromCookie } from '@/utils/cookie'

import { GETPostSchema } from './schema'

const maxAge = 5
const LIMIT = 20

export type GETPostsResponse = {
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
  likeCount: number
  commentCount: number
  repostCount: number
  viewCount?: number
  referredPost: ReferredPost | null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const params = Object.fromEntries(searchParams)
  const validation = GETPostSchema.safeParse(params)

  if (!validation.success) {
    return new Response('Bad Request', { status: 400 })
  }

  const { cursor, limit = LIMIT, mangaId, filter, username } = validation.data
  const currentUserId = await validateUserIdFromCookie()

  try {
    const postRows = await selectPosts({
      limit: limit + 1,
      cursor,
      mangaId,
      filter,
      username,
      currentUserId,
    })

    const cacheControl = createCacheControl({ private: true, maxAge })

    if (postRows.length === 0) {
      const response: GETPostsResponse = { posts: [], nextCursor: null }
      return Response.json(response, { headers: { 'Cache-Control': cacheControl } })
    }

    const hasNextPage = postRows.length > limit
    const posts = hasNextPage ? postRows.slice(0, limit) : postRows
    const lastPost = posts[posts.length - 1]
    const nextCursor = hasNextPage ? lastPost.id : null
    const response: GETPostsResponse = { posts, nextCursor }
    return Response.json(response, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
