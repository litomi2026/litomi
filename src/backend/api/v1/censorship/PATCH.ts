import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { MAX_CENSORSHIPS_PER_USER } from '@/constants/policy'
import { CensorshipKey, CensorshipLevel } from '@/database/enum'
import { userCensorshipTable } from '@/database/supabase/censorship'
import { db } from '@/database/supabase/drizzle'

const updateSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.coerce.number().int().positive(),
        key: z.enum(CensorshipKey),
        value: z.string().trim().min(1).max(256),
        level: z.enum(CensorshipLevel),
      }),
    )
    .min(1)
    .max(MAX_CENSORSHIPS_PER_USER),
})

export type PATCHV1CensorshipUpdateBody = z.infer<typeof updateSchema>
export type PATCHV1CensorshipUpdateResponse = { ids: number[] }

const route = new Hono<Env>()

route.patch('/', requireAuth, zProblemValidator('json', updateSchema), async (c) => {
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
