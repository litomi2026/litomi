import { idParamSchema, type PATCHV1LibraryIdResponse, patchV1LibraryIdBodySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { libraryTable } from '@litomi/db/app/library'
import { hexColorToInt } from '@litomi/domain/utils/color'
import { normalizeString } from '@litomi/std'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { adultVerificationRequiredResponse, shouldBlockAdultGate } from '@/utils/adult-gate'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.patch(
  '/',
  requireAuth,
  zProblemValidator('param', idParamSchema),
  zProblemValidator('json', patchV1LibraryIdBodySchema),
  async (c) => {
    const userId = c.get('userId')!
    const { id: libraryId } = c.req.valid('param')
    const { name, description, color, icon, isPublic } = c.req.valid('json')

    if (isPublic === false && shouldBlockAdultGate(c)) {
      return adultVerificationRequiredResponse(c)
    }

    try {
      const [updatedLibrary] = await db
        .update(libraryTable)
        .set({
          name: name.trim(),
          description: normalizeString(description),
          color: color ? hexColorToInt(color) : null,
          icon: icon || null,
          isPublic,
        })
        .where(and(eq(libraryTable.id, libraryId), eq(libraryTable.userId, userId)))
        .returning({ id: libraryTable.id })

      if (!updatedLibrary) {
        return problemResponse(c, { status: 404, detail: '서재를 찾을 수 없어요' })
      }

      return c.json({ id: updatedLibrary.id } satisfies PATCHV1LibraryIdResponse)
    } catch (error) {
      console.error(error)
      return problemResponse(c, { status: 500, detail: '서재를 수정하지 못했어요' })
    }
  },
)

export default route
