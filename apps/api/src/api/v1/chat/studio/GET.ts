import type { GETV1ChatStudioResponse } from '@litomi/contracts'
import { getChatArtistByUserId } from '@litomi/db/app/query/chat'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { noStoreCacheControl } from '@/utils/cache-control'

import { toChatArtistMine } from '../dto'

const route = new Hono<Env>()

// 스튜디오 진입점 — 내 아티스트 프로필. null이면 온보딩으로 안내한다.
route.get('/', requireAuth, async (c) => {
  const userId = c.get('userId')!
  const artist = await getChatArtistByUserId(userId)

  const response = {
    artist: artist && toChatArtistMine(artist),
  } satisfies GETV1ChatStudioResponse

  return c.json(response, { headers: { 'Cache-Control': noStoreCacheControl } })
})

export default route
