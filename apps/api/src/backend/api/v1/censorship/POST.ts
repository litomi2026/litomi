import { count, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { MAX_CENSORSHIPS_PER_USER } from '@/constants/policy'
import { CensorshipKey, CensorshipLevel } from '@/database/enum'
import { userCensorshipTable } from '@/database/supabase/censorship'
import { db } from '@/database/supabase/drizzle'

const createSchema = z.object({
  items: z
    .array(
      z.object({
        key: z.enum(CensorshipKey),
        value: z.string().trim().min(1).max(256),
        level: z.enum(CensorshipLevel),
      }),
    )
    .min(1)
    .max(100),
})

export type POSTV1CensorshipCreateBody = z.infer<typeof createSchema>
export type POSTV1CensorshipCreateResponse = { ids: number[] }

const route = new Hono<Env>()

route.post('/', zProblemValidator('json', createSchema), async (c) => {
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
          detail: `검열 규칙은 최대 ${MAX_CENSORSHIPS_PER_USER}개까지만 추가할 수 있어요. (현재 ${censorshipCount}개)`,
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

    return c.json<POSTV1CensorshipCreateResponse>({ ids })
  } catch (error) {
    if (error instanceof Error) {
      if (['foreign key', 'value too long', 'duplicate key'].some((message) => error.message.includes(message))) {
        return problemResponse(c, { status: 400, detail: '입력을 확인해 주세요' })
      }
    }

    console.error(error)
    return problemResponse(c, { status: 500, detail: '오류가 발생했어요' })
  }
})

export default route
