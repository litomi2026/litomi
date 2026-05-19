import { db } from '@litomi/db/database/app/drizzle'
import 'server-only'
import { postTable } from '@litomi/db/database/app/post'
import { userTable } from '@litomi/db/database/app/user'
import { desc, eq } from 'drizzle-orm'

export type PostComment = {
  id: number
  createdAt: Date
  content: string | null
  author: {
    id: number
    name: string
    nickname: string
    imageURL: string | null
  } | null
}

type Params = {
  parentPostId: number
  limit?: number
}

export default async function selectPostComment({ parentPostId, limit = 20 }: Params): Promise<PostComment[]> {
  const rows = await db
    .select({
      id: postTable.id,
      createdAt: postTable.createdAt,
      content: postTable.content,
      authorId: userTable.id,
      authorName: userTable.name,
      authorNickname: userTable.nickname,
      authorImageURL: userTable.imageURL,
    })
    .from(postTable)
    .leftJoin(userTable, eq(postTable.userId, userTable.id))
    .where(eq(postTable.parentPostId, parentPostId))
    .orderBy(desc(postTable.createdAt), desc(postTable.id))
    .limit(limit)

  return rows
    .map(({ authorId, authorName, authorNickname, authorImageURL, ...comment }) => ({
      ...comment,
      author:
        authorId !== null && authorName !== null && authorNickname !== null
          ? {
              id: authorId,
              name: authorName,
              nickname: authorNickname,
              imageURL: authorImageURL,
            }
          : null,
    }))
    .toReversed()
}
