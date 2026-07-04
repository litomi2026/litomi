import {
  chatHandleParamSchema,
  type PATCHV1ChatArtistResponse,
  PROBLEM,
  patchV1ChatArtistBodySchema,
} from '@litomi/contracts'
import { updateChatArtist } from '@litomi/db/app/query/chat'
import { isPostgresError } from '@litomi/db/error'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { toChatArtistMine } from '../../dto'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  zProblemValidator('param', chatHandleParamSchema),
  zProblemValidator('json', patchV1ChatArtistBodySchema),
)

route.patch('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { handle } = c.req.valid('param')
  const body = c.req.valid('json')

  try {
    const updated = await updateChatArtist({
      handle,
      userId,
      patch: body,
    })

    if (!updated) {
      return problemResponse(c, { status: 404 })
    }

    return c.json({
      artist: toChatArtistMine(updated),
    } satisfies PATCHV1ChatArtistResponse)
  } catch (error) {
    if (isPostgresError(error) && error.cause.code === '23505') {
      return problemResponse(c, {
        problem: PROBLEM.HANDLE_CONFLICT,
        extensions: {
          invalidParams: [
            {
              name: 'handle',
              code: PROBLEM.HANDLE_CONFLICT.slug,
              reason: '이미 사용 중인 핸들이에요.',
            },
          ],
        },
      })
    }

    throw error
  }
})

export default route
