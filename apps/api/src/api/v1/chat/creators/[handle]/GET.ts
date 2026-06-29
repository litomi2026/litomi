import { chatHandleParamSchema, type GETV1ChatCreatorResponse } from '@litomi/contracts'
import { getChatCreatorByHandle, hasActiveChatSubscription } from '@litomi/db/app/query/chat'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { toCreatorBrief } from '../../lib'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(requireAuth, zProblemValidator('param', chatHandleParamSchema))

// Resolves a handle to the creator's id and the viewer's role. The client needs the
// creatorId to build realtime room ids (b:{id} / c:{id}) and the role to pick the UI
// (studio vs fan room) — neither is derivable from the auth'd userId alone.
route.get('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { handle } = c.req.valid('param')
  const creator = await getChatCreatorByHandle(handle)

  if (!creator) {
    return problemResponse(c, { status: 404 })
  }

  const isOwner = creator.userId === userId
  const entitled = isOwner || (await hasActiveChatSubscription(userId, creator.id))

  const result = {
    creator: toCreatorBrief(creator),
    isOwner,
    entitled,
  }

  return c.json<GETV1ChatCreatorResponse>(result, { headers: { 'Cache-Control': privateCacheControl } })
})

export default route
