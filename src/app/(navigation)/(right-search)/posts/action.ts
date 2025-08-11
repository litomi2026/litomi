'use server'

import { captureException } from '@sentry/nextjs'
import { revalidatePath } from 'next/cache'
import { z } from 'zod/v4'

import { db } from '@/database/drizzle'
import { PostType } from '@/database/enum'
import { postTable } from '@/database/schema'
import { badRequest, created, internalServerError, unauthorized } from '@/utils/action-response'
import { flattenZodFieldErrors } from '@/utils/form-error'
import { getUserIdFromCookie } from '@/utils/session'

const createPostSchema = z.object({
  content: z.string().min(2).max(160),
  mangaId: z.coerce.number().int().positive().nullable(),
  parentPostId: z.coerce.number().int().positive().nullable(),
  referredPostId: z.coerce.number().int().positive().nullable(),
})

export async function createPost(formData: FormData) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인이 필요합니다', formData)
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
