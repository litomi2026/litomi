import { type POSTV1ChatArtistResponse, postV1ChatArtistBodySchema, problemCode } from '@litomi/contracts'
import { createChatArtist } from '@litomi/db/app/query/chat'
import { isPostgresError } from '@litomi/db/error'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { toChatArtistMine } from '../dto'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth, zProblemValidator('json', postV1ChatArtistBodySchema))

// 오픈 셀프서비스 온보딩 — 누구나 아티스트 프로필을 만들 수 있다(계정당 1개).
route.post('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const body = c.req.valid('json')

  try {
    const artist = await createChatArtist({
      userId,
      handle: body.handle,
      displayName: body.displayName,
      description: body.description,
      emoji: body.emoji,
      priceAmount: body.priceAmount,
    })

    const response = {
      artist: toChatArtistMine(artist),
    } satisfies POSTV1ChatArtistResponse

    return c.json(response, 201)
  } catch (error) {
    if (isPostgresError(error) && error.cause.code === '23505') {
      if (error.cause.constraint_name === 'chat_artist_handle_unique') {
        return problemResponse(c, {
          status: 409,
          code: problemCode.HANDLE_CONFLICT,
          title: '이미 사용 중인 핸들이에요.',
          extensions: {
            invalidParams: [
              {
                name: 'handle',
                code: problemCode.HANDLE_CONFLICT,
                reason: '이미 사용 중인 핸들이에요.',
              },
            ],
          },
        })
      }

      return problemResponse(c, {
        status: 409,
        code: problemCode.ARTIST_PROFILE_EXISTS,
        title: '이미 아티스트 프로필이 있어요.',
      })
    }

    throw error
  }
})

export default route
