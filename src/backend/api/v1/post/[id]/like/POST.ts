import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { isPostgresError } from '@/database/error'
import { db } from '@/database/supabase/drizzle'
import { postLikeTable } from '@/database/supabase/post'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

enum ToggleLikingPostAction {
  DELETED = 'deleted',
  INSERTED = 'inserted',
  NONE = 'none',
}

export type POSTV1PostIdLikeResponse = {
  liked: boolean
}

const route = new Hono<Env>()

route.post('/:id/like', requireAuth, zProblemValidator('param', paramsSchema), async (c) => {
  const userId = c.get('userId')!
  const { id: postId } = c.req.valid('param')

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

    return c.json<POSTV1PostIdLikeResponse>({ liked: action === ToggleLikingPostAction.INSERTED })
  } catch (error) {
    if (isPostgresError(error) && error.cause.code === '23503') {
      return problemResponse(c, { status: 404, detail: '글을 찾을 수 없어요' })
    }

    console.error(error)
    return problemResponse(c, { status: 500, detail: '좋아요를 처리하지 못했어요' })
  }
})

export default route
