import { and, count, desc, eq, inArray, isNotNull, lt, or, SQL } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

import type { ReferredPost } from '@/components/post/ReferredPostCard'

import { PostFilter } from '@/backend/api/v1/post/constant'
import { PostType } from '@/database/enum'
import { db } from '@/database/supabase/drizzle'
import { postLikeTable, postTable } from '@/database/supabase/post'
import { userTable } from '@/database/supabase/user'

type Params = {
  limit?: number
  cursorId?: number
  cursorCreatedAt?: Date
  mangaId?: number
  filter?: PostFilter
  postId?: number
  parentPostId?: number
  username?: string
}

export default async function selectPost({
  limit,
  cursorId,
  cursorCreatedAt,
  mangaId,
  filter,
  postId,
  parentPostId,
  username,
}: Params) {
  const conditions: (SQL | undefined)[] = []
  const commentPosts = alias(postTable, 'comment_posts')
  const repostPosts = alias(postTable, 'repost_posts')
  const referredPosts = alias(postTable, 'referred_posts')
  const referredUser = alias(userTable, 'referred_user')

  if (cursorId && cursorCreatedAt) {
    conditions.push(
      or(
        lt(postTable.createdAt, cursorCreatedAt),
        and(eq(postTable.createdAt, cursorCreatedAt), lt(postTable.id, cursorId)),
      ),
    )
  }

  if (mangaId) {
    conditions.push(eq(postTable.mangaId, mangaId))
  }

  if (postId) {
    conditions.push(eq(postTable.id, postId))
  }

  if (filter === PostFilter.MANGA) {
    conditions.push(isNotNull(postTable.mangaId))
  }

  if (parentPostId) {
    conditions.push(eq(postTable.parentPostId, parentPostId))
  }

  if (username) {
    conditions.push(eq(userTable.name, username))
  }

  let baseQuery = db
    .select({
      id: postTable.id,
      createdAt: postTable.createdAt,
    })
    .from(postTable)
    .$dynamic()

  if (username) {
    baseQuery = baseQuery.innerJoin(userTable, eq(postTable.userId, userTable.id))
  }

  baseQuery = baseQuery
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(postTable.createdAt), desc(postTable.id))

  if (limit) {
    baseQuery = baseQuery.limit(limit)
  }

  const basePosts = db.$with('base_posts').as(baseQuery)
  const basePostIds = db.select({ id: basePosts.id }).from(basePosts)

  const likeCounts = db.$with('like_counts').as(
    db
      .select({
        postId: postLikeTable.postId,
        likeCount: count().as('like_count'),
      })
      .from(postLikeTable)
      .where(inArray(postLikeTable.postId, basePostIds))
      .groupBy(postLikeTable.postId),
  )

  const commentCounts = db.$with('comment_counts').as(
    db
      .select({
        postId: commentPosts.parentPostId,
        commentCount: count().as('comment_count'),
      })
      .from(commentPosts)
      .where(and(isNotNull(commentPosts.parentPostId), inArray(commentPosts.parentPostId, basePostIds)))
      .groupBy(commentPosts.parentPostId),
  )

  const repostCounts = db.$with('repost_counts').as(
    db
      .select({
        postId: repostPosts.referredPostId,
        repostCount: count().as('repost_count'),
      })
      .from(repostPosts)
      .where(and(isNotNull(repostPosts.referredPostId), inArray(repostPosts.referredPostId, basePostIds)))
      .groupBy(repostPosts.referredPostId),
  )

  const postRows = await db
    .with(basePosts, likeCounts, commentCounts, repostCounts)
    .select({
      id: postTable.id,
      createdAt: postTable.createdAt,
      content: postTable.content,
      type: postTable.type,
      mangaId: postTable.mangaId,
      referredPostId: postTable.referredPostId,
      authorId: userTable.id,
      authorName: userTable.name,
      authorNickname: userTable.nickname,
      authorImageURL: userTable.imageURL,
      referredPostInnerId: referredPosts.id,
      referredPostCreatedAt: referredPosts.createdAt,
      referredPostContent: referredPosts.content,
      referredAuthorId: referredUser.id,
      referredAuthorName: referredUser.name,
      referredAuthorNickname: referredUser.nickname,
      referredAuthorImageURL: referredUser.imageURL,
      commentCount: commentCounts.commentCount,
      repostCount: repostCounts.repostCount,
      likeCount: likeCounts.likeCount,
    })
    .from(basePosts)
    .innerJoin(postTable, eq(postTable.id, basePosts.id))
    .leftJoin(userTable, eq(postTable.userId, userTable.id))
    .leftJoin(referredPosts, eq(referredPosts.id, postTable.referredPostId))
    .leftJoin(referredUser, eq(referredUser.id, referredPosts.userId))
    .leftJoin(likeCounts, eq(likeCounts.postId, basePosts.id))
    .leftJoin(commentCounts, eq(commentCounts.postId, basePosts.id))
    .leftJoin(repostCounts, eq(repostCounts.postId, basePosts.id))
    .orderBy(desc(basePosts.createdAt), desc(basePosts.id))

  return postRows.map(
    ({
      referredPostId,
      referredPostInnerId,
      referredPostCreatedAt,
      referredPostContent,
      referredAuthorId,
      referredAuthorName,
      referredAuthorNickname,
      referredAuthorImageURL,
      authorId,
      authorName,
      authorNickname,
      authorImageURL,
      ...post
    }) => {
      const author =
        authorId !== null && authorName !== null && authorNickname !== null
          ? {
              id: authorId,
              name: authorName,
              nickname: authorNickname,
              imageURL: authorImageURL,
            }
          : null

      const referredPostAuthor =
        referredAuthorId !== null && referredAuthorName !== null && referredAuthorNickname !== null
          ? {
              id: referredAuthorId,
              name: referredAuthorName,
              nickname: referredAuthorNickname,
              imageURL: referredAuthorImageURL,
            }
          : null

      const referredPost =
        post.type === PostType.REPOST && referredPostId === null
          ? ({ isDeleted: true } satisfies ReferredPost)
          : referredPostInnerId !== null && referredPostCreatedAt !== null
            ? ({
                id: referredPostInnerId,
                createdAt: referredPostCreatedAt,
                content: referredPostContent,
                author: referredPostAuthor,
              } satisfies ReferredPost)
            : null

      return {
        ...post,
        commentCount: post.commentCount ?? 0,
        repostCount: post.repostCount ?? 0,
        likeCount: post.likeCount ?? 0,
        author,
        referredPost,
      }
    },
  )
}
