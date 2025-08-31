'use server'

import { captureException } from '@sentry/nextjs'
import { sql } from 'drizzle-orm'
import { z } from 'zod/v4'

import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'
import { badRequest, internalServerError, ok, unauthorized } from '@/utils/action-response'
import { flattenZodFieldErrors } from '@/utils/form-error'
import { getUserIdFromCookie } from '@/utils/session'

const updateAutoDeletionSchema = z.object({
  autoDeletionDays: z.coerce
    .number()
    .int()
    .min(0)
    .max(365 * 5),
})

export async function updateAutoDeletionSettings(formData: FormData) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요', formData)
  }

  const validation = updateAutoDeletionSchema.safeParse({
    autoDeletionDays: formData.get('autoDeletionDays'),
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error), formData)
  }

  const { autoDeletionDays } = validation.data

  try {
    await db
      .update(userTable)
      .set({ autoDeletionDays })
      .where(sql`${userTable.id} = ${userId}`)

    return ok(true)
  } catch (error) {
    captureException(error, { extra: { name: 'updateAutoDeletionSettings', userId } })
    return internalServerError('자동 삭제 설정 중 오류가 발생했어요', formData)
  }
}
