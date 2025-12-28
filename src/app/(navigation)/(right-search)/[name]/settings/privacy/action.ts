'use server'

import { captureException } from '@sentry/nextjs'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/database/supabase/drizzle'
import { userTable } from '@/database/supabase/user'
import { badRequest, internalServerError, ok, unauthorized } from '@/utils/action-response'
import { validateUserIdFromCookie } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'

const updateAutoDeletionSchema = z.object({
  autoDeletionDays: z.coerce
    .number()
    .int()
    .min(0)
    .max(365 * 5),
})

export async function updateAutoDeletionSettings(formData: FormData) {
  const userId = await validateUserIdFromCookie()

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
    await db.update(userTable).set({ autoDeletionDays }).where(eq(userTable.id, userId))

    return ok(true)
  } catch (error) {
    captureException(error, { extra: { name: 'updateAutoDeletionSettings', userId } })
    return internalServerError('자동 삭제 설정 중 오류가 발생했어요', formData)
  }
}
