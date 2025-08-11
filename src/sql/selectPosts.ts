import { and, countDistinct, desc, eq, SQL, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

import { PostFilter } from '@/app/api/post/schema'
import { db } from '@/database/drizzle'
import { postLikeTable, postTable, userTable } from '@/database/schema'

type Params = {
  limit?: number
  cursor?: number
  mangaId?: number
  filter?: PostFilter
  parentPostId?: number
  userId?: number
  currentUserId?: string | null
}

export default async function selectPosts({
  limit,
  cursor,
  mangaId,
  filter,
  parentPostId,
  userId,
  currentUserId,
}: Params) {
  const conditions: (SQL | undefined)[] = []
  const comments = alias(postTable, 'comments')
  const reposts = alias(postTable, 'reposts')

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

  if (userId) {
    conditions.push(sql`${postTable.userId} = ${userId}`)
  }

  const query = db
    .select({
      id: postTable.id,
      userId: postTable.userId,
      content: postTable.content,
      mangaId: postTable.mangaId,
      parentPostId: postTable.parentPostId,
      referredPostId: postTable.referredPostId,
      type: postTable.type,
      createdAt: postTable.createdAt,
      author: {
        id: userTable.id,
        name: userTable.name,
        nickname: userTable.nickname,
        imageURL: userTable.imageURL,
      },
      likeCount: countDistinct(postLikeTable.userId),
      commentCount: countDistinct(comments.id),
      repostCount: countDistinct(reposts.id),
    })
    .from(postTable)
    .leftJoin(userTable, eq(postTable.userId, userTable.id))
    .leftJoin(postLikeTable, eq(postTable.id, postLikeTable.postId))
    .leftJoin(comments, eq(comments.parentPostId, postTable.id))
    .leftJoin(reposts, eq(reposts.referredPostId, postTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(postTable.id, userTable.id)
    .orderBy(desc(postTable.createdAt), desc(postTable.id))

  if (limit) {
    query.limit(limit)
  }

  return query
}
