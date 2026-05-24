import {
  patchV1MePasskeyBodySchema,
  patchV1MePasskeyParamSchema,
  type PATCHV1MePasskeyResponse,
} from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { credentialTable } from '@litomi/db/app/passkey'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.patch(
  '/',
  zProblemValidator('param', patchV1MePasskeyParamSchema),
  zProblemValidator('json', patchV1MePasskeyBodySchema),
  async (c) => {
    const userId = c.get('userId')!
    const { id } = c.req.valid('param')
    const { name } = c.req.valid('json')

    try {
      const [updated] = await db
        .update(credentialTable)
        .set({ name })
        .where(and(eq(credentialTable.id, id), eq(credentialTable.userId, userId)))
        .returning({ id: credentialTable.id, name: credentialTable.name })

      if (!updated) {
        return problemResponse(c, { status: 404, detail: '패스키를 찾을 수 없어요' })
      }

      return c.json<PATCHV1MePasskeyResponse>({
        id: updated.id,
        name,
        message: '패스키 이름을 저장했어요',
      })
    } catch (error) {
      console.error(error)
      return problemResponse(c, { status: 500, detail: '패스키 이름 저장 중 오류가 발생했어요' })
    }
  },
)

export default route
