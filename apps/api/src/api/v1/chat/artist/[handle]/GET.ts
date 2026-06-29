import { chatHandleParamSchema, type GETV1ChatArtistResponse } from '@litomi/contracts'
import { getChatArtistByHandle, hasActiveChatSubscription } from '@litomi/db/app/query/chat'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { toArtistBrief } from '../../lib'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(requireAuth, zProblemValidator('param', chatHandleParamSchema))

// Resolves a handle to the artist's id and the viewer's role. The client needs the
// artistId to build realtime room ids (b:{id} / c:{id}) and the role to pick the UI
// (studio vs fan room) — neither is derivable from the auth'd userId alone.
route.get('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { handle } = c.req.valid('param')
  const artist = await getChatArtistByHandle(handle)

  if (!artist) {
    return problemResponse(c, { status: 404 })
  }

  const isOwner = artist.userId === userId
  const entitled = isOwner || (await hasActiveChatSubscription(userId, artist.id))

  const result = {
    artist: toArtistBrief(artist),
    isOwner,
    entitled,
  }

  return c.json<GETV1ChatArtistResponse>(result, { headers: { 'Cache-Control': privateCacheControl } })
})

export default route
