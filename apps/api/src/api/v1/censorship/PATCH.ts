import { patchV1CensorshipUpdateBodySchema, type PATCHV1CensorshipUpdateResponse } from '@litomi/contracts'
import { userCensorshipTable } from '@litomi/db/database/app/censorship'
import { db } from '@litomi/db/database/app/drizzle'
import { sql } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.patch('/', zProblemValidator('json', patchV1CensorshipUpdateBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { items } = c.req.valid('json')

  const updateData = items.map(({ id, key, value, level }) => ({
    id,
    key,
    value: value.trim(),
    level,
    userId,
  }))

  try {
    const result = await db
      .insert(userCensorshipTable)
      .values(updateData)
      .onConflictDoUpdate({
        target: userCensorshipTable.id,
        set: {
          key: sql`excluded.${sql.identifier(userCensorshipTable.key.name)}`,
          value: sql`excluded.${sql.identifier(userCensorshipTable.value.name)}`,
          level: sql`excluded.${sql.identifier(userCensorshipTable.level.name)}`,
        },
        setWhere: sql`${userCensorshipTable.userId} = ${userId}`,
      })
      .returning({ id: userCensorshipTable.id })

    return c.json<PATCHV1CensorshipUpdateResponse>({ ids: result.map((r) => r.id) })
  } catch (error) {
    if (error instanceof Error) {
      if (['foreign key', 'constraint', 'invalid input'].some((message) => error.message.includes(message))) {
        return problemResponse(c, { status: 400, detail: '입력을 확인해 주세요' })
      }
    }

    console.error(error)
    return problemResponse(c, { status: 500, detail: '업데이트 도중 오류가 발생했어요' })
  }
})

export default route
