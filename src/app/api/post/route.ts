import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import selectPosts from '@/sql/selectPosts'
import { getUserIdFromCookie } from '@/utils/session'

import { GETPostSchema } from './schema'

const maxAge = 10
const LIMIT = 20

export type GETPostsResponse = {
  posts: Post[]
  nextCursor: number | null
}

export type Post = {
  id: number
  userId: number
  content: string
  mangaId: number | null
  parentPostId: number | null
  referredPostId: number | null
  type: number
  createdAt: Date
  author: {
    id: number
    name: string
    nickname: string
    imageURL: string | null
  } | null
  likeCount: number
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const params = Object.fromEntries(searchParams)
  const validation = GETPostSchema.safeParse(params)

  if (!validation.success) {
    return new Response('Bad Request', { status: 400 })
  }

  const { cursor, limit = LIMIT, mangaId, filter, userId } = validation.data
  const currentUserId = await getUserIdFromCookie()

  try {
    const postRows = await selectPosts({
      limit: limit + 1,
      cursor,
      mangaId,
      filter,
      userId,
      currentUserId,
    })

    const cacheControl = createCacheControl({
      public: false,
      private: true,
      maxAge,
      staleWhileRevalidate: maxAge,
    })

    if (postRows.length === 0) {
      return new Response(null, {
        status: 204,
        headers: { 'Cache-Control': cacheControl },
      })
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
