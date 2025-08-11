'use server'

import { captureException } from '@sentry/nextjs'
import { and, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod/v4'

import { db } from '@/database/drizzle'
import { PostType } from '@/database/enum'
import { postLikeTable, postTable } from '@/database/schema'
import { badRequest, created, internalServerError, noContent, notFound, unauthorized } from '@/utils/action-response'
import { flattenZodFieldErrors } from '@/utils/form-error'
import { getUserIdFromCookie } from '@/utils/session'

const createPostSchema = z.object({
  content: z.string().min(2).max(160),
  mangaId: z.coerce.number().int().positive().nullable(),
  parentPostId: z.coerce.number().int().positive().nullable(),
  referredPostId: z.coerce.number().int().positive().nullable(),
})

enum ToggleLikingPostAction {
  DELETED = 1,
  INSERTED = 2,
  NONE = 0,
}

export async function createPost(formData: FormData) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요', formData)
  }

  const validation = createPostSchema.safeParse({
    content: formData.get('content'),
    mangaId: formData.get('manga-id'),
    parentPostId: formData.get('parent-post-id'),
    referredPostId: formData.get('referred-post-id'),
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error), formData)
  }

  const { content, mangaId, parentPostId, referredPostId } = validation.data

  try {
    const [post] = await db
      .insert(postTable)
      .values({
        userId: Number(userId),
        content,
        mangaId,
        parentPostId,
        referredPostId,
        type: PostType.TEXT,
      })
      .returning({ id: postTable.id })

    revalidatePath('/posts/recommand')

    console.log('👀 - createPost - mangaId:', mangaId)
    if (mangaId) {
      revalidatePath(`/manga/${mangaId}/post`)
    }

    return created(post)
  } catch (error) {
    captureException(error, { extra: { formData } })
    return internalServerError('글을 작성하지 못했어요', formData)
  }
}

export async function deletePost(postId: number) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  try {
    const [deletedPost] = await db
      .delete(postTable)
      .where(and(sql`${postTable.userId} = ${userId}`, eq(postTable.id, postId)))
      .returning({ id: postTable.id })

    if (!deletedPost) {
      return notFound('글을 찾을 수 없어요')
    }

    revalidatePath('/posts/[filter]', 'page')
    return noContent()
  } catch (error) {
    captureException(error, { extra: { postId } })
    return internalServerError('글을 삭제하지 못했어요')
  }
}

export async function toggleLikingPost(postId: number) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  try {
    const [{ action }] = await db.execute<{ action: ToggleLikingPostAction }>(sql`
      WITH deleted AS (
        DELETE FROM ${postLikeTable}
        WHERE ${postLikeTable.userId} = ${userId} 
          AND ${postLikeTable.postId} = ${postId}
        RETURNING ${ToggleLikingPostAction.DELETED} AS action
      ),
      inserted AS (
        INSERT INTO ${postLikeTable} (user_id, post_id)
        SELECT ${userId}, ${postId}
        WHERE NOT EXISTS (SELECT 1 FROM deleted)
        RETURNING ${ToggleLikingPostAction.INSERTED} AS action
      )
      SELECT COALESCE(
        (SELECT action FROM deleted),
        (SELECT action FROM inserted),
        ${ToggleLikingPostAction.NONE}
      ) AS action
    `)

    return { liked: action === ToggleLikingPostAction.INSERTED }
  } catch (error) {
    captureException(error, { extra: { postId } })
    return internalServerError('좋아요를 처리하지 못했어요')
  }
}
