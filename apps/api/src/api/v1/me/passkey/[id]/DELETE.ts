import { type DELETEV1MePasskeyResponse, deleteV1MePasskeyParamSchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { credentialTable } from '@litomi/db/app/passkey'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.delete('/', zProblemValidator('param', deleteV1MePasskeyParamSchema), async (c) => {
  const userId = c.get('userId')!
  const { id } = c.req.valid('param')

  try {
    const [deleted] = await db
      .delete(credentialTable)
      .where(and(eq(credentialTable.id, id), eq(credentialTable.userId, userId)))
      .returning({ id: credentialTable.id })

    if (!deleted) {
      return problemResponse(c, { status: 404, detail: '패스키를 찾을 수 없어요' })
    }

    return c.json<DELETEV1MePasskeyResponse>({
      id: deleted.id,
      message: '패스키가 삭제됐어요',
    })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '패스키 삭제 중 오류가 발생했어요' })
  }
})

export default route
