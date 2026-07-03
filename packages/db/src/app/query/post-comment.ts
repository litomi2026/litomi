import { db } from '@litomi/db/app'
import { postTable } from '@litomi/db/app/post'
import { userTable } from '@litomi/db/app/user'
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

export interface SelectPostCommentOptions {
  limit?: number
}

export default async function selectPostComment(
  parentPostId: number,
  options: SelectPostCommentOptions = {},
): Promise<PostComment[]> {
  const { limit = 20 } = options

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
    .map(({ authorId: id, authorName: name, authorNickname: nickname, authorImageURL: imageURL, ...comment }) => {
      const author = id !== null && name !== null && nickname !== null ? { id, name, nickname, imageURL } : null

      return { ...comment, author }
    })
    .toReversed()
}
