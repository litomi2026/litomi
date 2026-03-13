import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { adultVerificationRequiredResponse, shouldBlockAdultGate } from '@/backend/utils/adult-gate'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { MAX_LIBRARY_DESCRIPTION_LENGTH, MAX_LIBRARY_NAME_LENGTH } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { libraryTable } from '@/database/supabase/library'
import { hexColorToInt } from '@/utils/color'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

const patchBodySchema = z.object({
  name: z
    .string()
    .min(1, '서재 이름을 입력해 주세요')
    .max(MAX_LIBRARY_NAME_LENGTH, `이름은 ${MAX_LIBRARY_NAME_LENGTH}자 이하여야 해요`),
  description: z
    .string()
    .max(MAX_LIBRARY_DESCRIPTION_LENGTH, `설명은 ${MAX_LIBRARY_DESCRIPTION_LENGTH}자 이하여야 해요`)
    .nullable()
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, '올바른 색상 코드를 입력해 주세요')
    .nullable()
    .optional(),
  icon: z.string().max(4, '이모지는 하나만 입력할 수 있어요').nullable().optional(),
  isPublic: z.boolean().optional().default(false),
})

export type PATCHV1LibraryIdBody = z.infer<typeof patchBodySchema>
export type PATCHV1LibraryIdResponse = { id: number }

const route = new Hono<Env>()

route.patch('/', requireAuth, zProblemValidator('param', paramsSchema), zProblemValidator('json', patchBodySchema), async (c) => {
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
        description: description?.trim() || null,
        color: color ? hexColorToInt(color) : null,
        icon: icon || null,
        isPublic,
      })
      .where(and(eq(libraryTable.id, libraryId), eq(libraryTable.userId, userId)))
      .returning({ id: libraryTable.id })

    if (!updatedLibrary) {
      return problemResponse(c, { status: 404, detail: '서재를 찾을 수 없어요' })
    }

    return c.json<PATCHV1LibraryIdResponse>({ id: updatedLibrary.id })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '서재를 수정하지 못했어요' })
  }
})

export default route
