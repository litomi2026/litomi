import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { MAX_POST_CONTENT_LENGTH } from '@/constants/policy'
import { PostType } from '@/database/enum'
import { isPostgresError } from '@/database/error'
import { db } from '@/database/supabase/drizzle'
import { postTable } from '@/database/supabase/post'

const createPostSchema = z.object({
  content: z.string().min(2).max(MAX_POST_CONTENT_LENGTH),
  mangaId: z.coerce.number().int().positive().nullable().optional(),
  parentPostId: z.coerce.number().int().positive().nullable().optional(),
  referredPostId: z.coerce.number().int().positive().nullable().optional(),
})

export type POSTV1PostBody = z.infer<typeof createPostSchema>
export type POSTV1PostResponse = { id: number }

const route = new Hono<Env>()

route.post('/', requireAuth, zProblemValidator('json', createPostSchema), async (c) => {
  const userId = c.get('userId')!
  const { content, mangaId, parentPostId, referredPostId } = c.req.valid('json')

  try {
    const [createdPost] = await db
      .insert(postTable)
      .values({
        userId,
        content,
        mangaId: mangaId ?? null,
        parentPostId: parentPostId ?? null,
        referredPostId: referredPostId ?? null,
        type: PostType.TEXT,
      })
      .returning({ id: postTable.id })

    if (!createdPost) {
      return problemResponse(c, { status: 500, detail: '글을 작성하지 못했어요' })
    }

    return c.json<POSTV1PostResponse>({ id: createdPost.id }, 201)
  } catch (error) {
    if (isPostgresError(error) && error.cause.code === '23503') {
      return problemResponse(c, { status: 404, detail: '대상 글을 찾을 수 없어요' })
    }

    console.error(error)
    return problemResponse(c, { status: 500, detail: '글을 작성하지 못했어요' })
  }
})

export default route
