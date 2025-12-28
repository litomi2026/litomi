'use server'

import { captureException } from '@sentry/nextjs'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { db } from '@/database/supabase/drizzle'
import { credentialTable } from '@/database/supabase/passkey'
import { badRequest, internalServerError, notFound, ok, unauthorized } from '@/utils/action-response'
import { validateUserIdFromCookie } from '@/utils/cookie'

const deleteCredentialSchema = z.object({
  'credential-id': z.coerce.number().int().positive(),
})

export async function deleteCredential(formData: FormData) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = deleteCredentialSchema.safeParse({ 'credential-id': formData.get('credential-id') })

  if (!validation.success) {
    return badRequest('잘못된 요청이에요')
  }

  const { 'credential-id': credentialId } = validation.data

  try {
    const [deletedCredential] = await db
      .delete(credentialTable)
      .where(and(eq(credentialTable.id, credentialId), eq(credentialTable.userId, userId)))
      .returning({ id: credentialTable.id })

    if (!deletedCredential) {
      return notFound('패스키를 찾을 수 없어요')
    }

    revalidatePath('/[name]/settings', 'page')
    return ok('패스키가 삭제됐어요')
  } catch (error) {
    console.error('deleteCredential:', error)
    captureException(error, { extra: { name: 'deleteCredential', userId } })
    return internalServerError('패스키 삭제 중 오류가 발생했어요')
  }
}
