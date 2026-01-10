import { and, eq, inArray } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { MAX_CENSORSHIPS_PER_USER } from '@/constants/policy'
import { userCensorshipTable } from '@/database/supabase/censorship'
import { db } from '@/database/supabase/drizzle'

const deleteSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1).max(MAX_CENSORSHIPS_PER_USER),
})

export type DELETEV1CensorshipDeleteBody = z.infer<typeof deleteSchema>
export type DELETEV1CensorshipDeleteResponse = { ids: number[] }

const route = new Hono<Env>()

route.delete('/', requireAuth, zProblemValidator('json', deleteSchema), async (c) => {
  const userId = c.get('userId')!
  const { ids } = c.req.valid('json')

  try {
    const deleted = await db
      .delete(userCensorshipTable)
      .where(and(eq(userCensorshipTable.userId, userId), inArray(userCensorshipTable.id, ids)))
      .returning({ id: userCensorshipTable.id })

    return c.json<DELETEV1CensorshipDeleteResponse>({ ids: deleted.map((r) => r.id) })
  } catch (error) {
    if (error instanceof Error) {
      if (['foreign key', 'constraint'].some((message) => error.message.includes(message))) {
        return problemResponse(c, { status: 400, detail: '입력을 확인해 주세요' })
      }
    }

    console.error(error)
    return problemResponse(c, { status: 500, detail: '오류가 발생했어요' })
  }
})

export default route
