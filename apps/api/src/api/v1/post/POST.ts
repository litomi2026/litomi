import { postV1PostBodySchema, type POSTV1PostResponse } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { postTable } from '@litomi/db/app/post'
import { isPostgresError } from '@litomi/db/error'
import { PostType } from '@litomi/domain/post/model'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.post('/', requireAuth, zProblemValidator('json', postV1PostBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { content, mangaId, parentPostId, referredPostId } = c.req.valid('json')

  if (parentPostId && referredPostId) {
    return problemResponse(c, { status: 400, detail: '답글과 리포스트를 동시에 지정할 수 없어요' })
  }

  const type = parentPostId ? PostType.REPLY : referredPostId ? PostType.REPOST : PostType.TEXT

  try {
    const [createdPost] = await db
      .insert(postTable)
      .values({
        userId,
        content,
        mangaId: mangaId ?? null,
        parentPostId: parentPostId ?? null,
        referredPostId: referredPostId ?? null,
        type,
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
