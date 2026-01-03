import { and, eq, gte } from 'drizzle-orm'
import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { streamSSE } from 'hono/streaming'
import ms from 'ms'
import 'server-only'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { CookieKey } from '@/constants/storage'
import { bbatonVerificationTable } from '@/database/supabase/bbaton'
import { db } from '@/database/supabase/drizzle'

import { verifyBBatonAttemptToken } from './utils'

export type BBatonSSECompleteEvent = {
  type: 'complete'
  adultFlag: 'N' | 'Y'
  verifiedAt: string
}

export type BBatonSSEPingEvent = {
  type: 'ping'
}

export type BBatonSSETimeoutEvent = {
  type: 'timeout'
}

const POLL_INTERVAL_MS = ms('1s')
const KEEPALIVE_MS = ms('15s')

const route = new Hono<Env>()

route.get('/', requireAuth, async (c) => {
  const attemptToken = getCookie(c, CookieKey.BBATON_ATTEMPT_ID)
  if (!attemptToken) {
    return problemResponse(c, { status: 400, detail: '인증 시도가 만료됐어요. 다시 시도해 주세요.' })
  }

  const userId = c.get('userId')!
  const attempt = await verifyBBatonAttemptToken(attemptToken)

  if (!attempt || attempt.userId !== userId) {
    return problemResponse(c, { status: 400, detail: '인증 시도가 만료됐어요. 다시 시도해 주세요.' })
  }

  const issuedAtMs = attempt.issuedAt * 1000
  const expiresAtMs = attempt.expiresAt * 1000

  c.header('Cache-Control', 'no-store')
  c.header('X-Accel-Buffering', 'no')

  return streamSSE(c, async (stream) => {
    let aborted = false
    stream.onAbort(() => {
      aborted = true
    })

    // NOTE: 프록시/브라우저가 스트림을 유지하도록 주기적으로 keep-alive 이벤트를 보내요.
    let lastKeepAliveAt = Date.now()

    while (!aborted) {
      const now = Date.now()

      if (now >= expiresAtMs) {
        const event: BBatonSSETimeoutEvent = { type: 'timeout' }
        await stream.writeSSE({ event: 'timeout', data: JSON.stringify(event) })
        return
      }

      const [row] = await db
        .select({
          adultFlag: bbatonVerificationTable.adultFlag,
          verifiedAt: bbatonVerificationTable.verifiedAt,
        })
        .from(bbatonVerificationTable)
        .where(
          and(
            eq(bbatonVerificationTable.userId, userId),
            gte(bbatonVerificationTable.verifiedAt, new Date(issuedAtMs)),
          ),
        )

      if (row) {
        const event: BBatonSSECompleteEvent = {
          type: 'complete',
          adultFlag: row.adultFlag ? 'Y' : 'N',
          verifiedAt: row.verifiedAt.toISOString(),
        }

        await stream.writeSSE({ event: 'complete', data: JSON.stringify(event) })
        return
      }

      if (now - lastKeepAliveAt >= KEEPALIVE_MS) {
        lastKeepAliveAt = now
        const keepAlive: BBatonSSEPingEvent = { type: 'ping' }
        await stream.writeSSE({ event: 'ping', data: JSON.stringify(keepAlive) })
      }

      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    }
  })
})

export default route
