import { and, count, desc, eq, SQL, sql } from 'drizzle-orm'

import { db } from '@/database/drizzle'
import { postLikeTable, postTable, userTable } from '@/database/schema'

export type PostRow = {
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

type Params = {
  limit?: number
  cursor?: number
  mangaId?: number
  filter?: 'following' | 'manga' | 'recommand'
  userId?: number
  currentUserId?: number | null
}

export default async function selectPosts({
  limit,
  cursor,
  mangaId,
  filter,
  userId,
  currentUserId,
}: Params): Promise<PostRow[]> {
  const conditions: (SQL | undefined)[] = []

  if (cursor) {
    conditions.push(sql`${postTable.id} < ${cursor}`)
  }

  if (mangaId) {
    conditions.push(eq(postTable.mangaId, mangaId))
  }

  if (filter === 'manga') {
    conditions.push(sql`${postTable.mangaId} IS NOT NULL`)
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
      likeCount: count(postLikeTable.userId),
    })
    .from(postTable)
    .leftJoin(userTable, eq(postTable.userId, userTable.id))
    .leftJoin(postLikeTable, eq(postTable.id, postLikeTable.postId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(postTable.id, userTable.id)
    .orderBy(desc(postTable.createdAt), desc(postTable.id))

  if (limit) {
    query.limit(limit)
  }

  return query
}
