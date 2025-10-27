import { and, countDistinct, desc, eq, SQL, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

import { PostFilter } from '@/app/api/post/schema'
import { db } from '@/database/supabase/drizzle'
import { postLikeTable, postTable, userTable } from '@/database/supabase/schema'

type Params = {
  limit?: number
  cursor?: number
  mangaId?: number
  filter?: PostFilter
  parentPostId?: number
  username?: string
  currentUserId?: number | null
}

export default async function selectPosts({
  limit,
  cursor,
  mangaId,
  filter,
  parentPostId,
  username,
  currentUserId,
}: Params) {
  const conditions: (SQL | undefined)[] = []
  const comments = alias(postTable, 'comments')
  const reposts = alias(postTable, 'reposts')
  const referredPosts = alias(postTable, 'referred_posts')
  const referredUser = alias(userTable, 'referred_user')

  if (cursor) {
    conditions.push(sql`${postTable.id} < ${cursor}`)
  }

  if (mangaId) {
    conditions.push(eq(postTable.mangaId, mangaId))
  }

  if (filter === PostFilter.MANGA) {
    conditions.push(sql`${postTable.mangaId} IS NOT NULL`)
  }

  if (parentPostId) {
    conditions.push(eq(postTable.parentPostId, parentPostId))
  }

  if (username) {
    conditions.push(eq(userTable.name, username))
  }

  const query = db
    .select({
      id: postTable.id,
      createdAt: postTable.createdAt,
      content: postTable.content,
      mangaId: postTable.mangaId,
      author: {
        id: userTable.id,
        name: userTable.name,
        nickname: userTable.nickname,
        imageURL: userTable.imageURL,
      },
      commentCount: countDistinct(comments.id),
      repostCount: countDistinct(reposts.id),
      likeCount: countDistinct(postLikeTable.userId),
      referredPost: {
        id: referredPosts.id,
        createdAt: referredPosts.createdAt,
        content: referredPosts.content,
        author: {
          id: referredUser.id,
          name: referredUser.name,
          nickname: referredUser.nickname,
          imageURL: referredUser.imageURL,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      },
    })
    .from(postTable)
    .leftJoin(userTable, eq(postTable.userId, userTable.id))
    .leftJoin(postLikeTable, eq(postTable.id, postLikeTable.postId))
    .leftJoin(comments, eq(comments.parentPostId, postTable.id))
    .leftJoin(reposts, eq(reposts.referredPostId, postTable.id))
    .leftJoin(referredPosts, eq(referredPosts.id, postTable.referredPostId))
    .leftJoin(referredUser, eq(referredUser.id, referredPosts.userId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(postTable.id, userTable.id, referredPosts.id, referredUser.id)
    .orderBy(desc(postTable.createdAt), desc(postTable.id))

  if (limit) {
    query.limit(limit)
  }

  return query
}
