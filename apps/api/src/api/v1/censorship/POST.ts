import { type POSTV1CensorshipCreateResponse, postV1CensorshipCreateBodySchema, problemCode } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { userCensorshipTable } from '@litomi/db/app/censorship'
import { MAX_CENSORSHIPS_PER_USER } from '@litomi/domain/censorship/policy'
import { count, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.post('/', zProblemValidator('json', postV1CensorshipCreateBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { items } = c.req.valid('json')

  const censorships = items.map(({ key, value, level }) => ({
    userId,
    key,
    value: value.trim(),
    level,
  }))

  try {
    const ids = await db.transaction(async (tx) => {
      const [{ count: censorshipCount }] = await tx
        .select({ count: count(userCensorshipTable.id) })
        .from(userCensorshipTable)
        .where(eq(userCensorshipTable.userId, userId))

      if (censorshipCount + censorships.length > MAX_CENSORSHIPS_PER_USER) {
        return problemResponse(c, {
          status: 400,
          code: problemCode.CENSORSHIP_LIMIT_REACHED,
          detail: `검열 규칙은 최대 ${MAX_CENSORSHIPS_PER_USER}개까지만 추가할 수 있어요. (현재 ${censorshipCount}개)`,
          extensions: {
            limit: MAX_CENSORSHIPS_PER_USER,
            current: censorshipCount,
          },
        })
      }

      const inserted = await tx
        .insert(userCensorshipTable)
        .values(censorships)
        .returning({ id: userCensorshipTable.id })

      return inserted.map((r) => r.id)
    })

    if (ids instanceof Response) {
      return ids
    }

    return c.json({ ids } satisfies POSTV1CensorshipCreateResponse)
  } catch (error) {
    if (error instanceof Error) {
      if (['foreign key', 'value too long', 'duplicate key'].some((message) => error.message.includes(message))) {
        return problemResponse(c, { status: 400, detail: '입력을 확인해 주세요' })
      }
    }

    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
