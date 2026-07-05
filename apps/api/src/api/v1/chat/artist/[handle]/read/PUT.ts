import { chatHandleParamSchema, putV1ChatReadBodySchema } from '@litomi/contracts'
import { getChatArtistByHandle } from '@litomi/db/app/query/chat'
import { setFanWatermark } from '@litomi/db/chat/query'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { resolveTimelineAccess } from '../../../access'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  zProblemValidator('param', chatHandleParamSchema),
  zProblemValidator('json', putV1ChatReadBodySchema),
)

route.put('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { handle } = c.req.valid('param')
  const { lastReadMessageId } = c.req.valid('json')
  const artist = await getChatArtistByHandle(handle)

  if (!artist) {
    return problemResponse(c, { status: 404 })
  }

  const access = await resolveTimelineAccess(userId, artist)

  if (!access) {
    return problemResponse(c, { status: 403 })
  }

  // 팬 타임라인은 방송 + 아티스트 1:1 답장이 messageId(ULID)로 머지되므로, 통합 커서 하나로
  // 두 축(방송 안읽음·1:1 안읽음)을 함께 전진시킨다.
  if (access.kind !== 'owner') {
    await setFanWatermark({ fanId: userId, artistId: artist.id, lastReadMessageId })
  }

  return c.body(null, 204)
})

export default route
