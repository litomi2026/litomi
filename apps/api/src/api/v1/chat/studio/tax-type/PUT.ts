import { type PUTV1ChatTaxTypeResponse, putV1ChatTaxTypeBodySchema } from '@litomi/contracts'
import { getChatArtistByUserId, setSettlementTaxProfile } from '@litomi/db/app/query/chat'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth, zProblemValidator('json', putV1ChatTaxTypeBodySchema))

// 정산 세무 프로필 변경 — 아티스트 본인만. 원천징수 여부(individual=3.3%, 그 외=없음)를 가른다.
route.put('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { taxType, countryCode } = c.req.valid('json')
  const artist = await getChatArtistByUserId(userId)

  if (!artist) {
    return problemResponse(c, { status: 404 })
  }

  await setSettlementTaxProfile(userId, { taxType, countryCode })

  return c.json({
    taxType,
    settlementCountryCode: taxType === 'non_resident' ? countryCode : undefined,
  } satisfies PUTV1ChatTaxTypeResponse)
})

export default route
