'use server'

import { captureException } from '@sentry/nextjs'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/database/supabase/drizzle'
import { trustedBrowserTable } from '@/database/supabase/schema'
import { badRequest, internalServerError, noContent, unauthorized } from '@/utils/action-response'
import { validateUserIdFromCookie } from '@/utils/cookie'

const revokeTrustedBrowserSchema = z.object({
  trustedBrowserId: z.coerce.number().int().positive(),
})

export async function revokeAllTrustedBrowsers() {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  try {
    await db.delete(trustedBrowserTable).where(eq(trustedBrowserTable.userId, userId))

    return noContent()
  } catch (error) {
    console.error('revokeAllTrustedBrowsers:', error)
    captureException(error, { tags: { action: 'revokeAllTrustedBrowsers' } })
    return internalServerError('브라우저 제거에 실패했어요')
  }
}

export async function revokeTrustedBrowser(formData: FormData) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = revokeTrustedBrowserSchema.safeParse({ trustedBrowserId: formData.get('trustedBrowserId') })

  if (!validation.success) {
    return badRequest('잘못된 요청이에요')
  }

  const { trustedBrowserId } = validation.data

  try {
    await db
      .delete(trustedBrowserTable)
      .where(and(eq(trustedBrowserTable.userId, userId), eq(trustedBrowserTable.id, trustedBrowserId)))

    return noContent()
  } catch (error) {
    console.error('revokeTrustedBrowser:', error)
    captureException(error, { tags: { action: 'revokeTrustedBrowser' } })
    return internalServerError('브라우저 제거에 실패했어요')
  }
}
