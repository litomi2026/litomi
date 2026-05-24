'use server'

import { getUserIdFromCookie } from '@litomi/auth/cookie'
import { decryptTOTPSecret, verifyTOTPToken } from '@litomi/auth/two-factor'
import { generateBackupCodes } from '@litomi/auth/two-factor-backup-code'
import { db } from '@litomi/db/app'
import { twoFactorBackupCodeTable, twoFactorTable } from '@litomi/db/app/two-factor'
import { captureException } from '@sentry/nextjs'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

import { badRequest, noContent, ok, unauthorized } from '@/utils/action-response'

const tokenSchema = z.object({
  token: z.string().length(6).regex(/^\d+$/),
})

export async function regenerateBackupCodes(formData: FormData) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = tokenSchema.safeParse({ token: formData.get('token') })

  if (!validation.success) {
    return badRequest('잘못된 인증 코드예요')
  }

  const { token } = validation.data

  try {
    const result = await db.transaction(async (tx) => {
      const [twoFactor] = await tx
        .select({ secret: twoFactorTable.secret })
        .from(twoFactorTable)
        .where(and(eq(twoFactorTable.userId, userId), isNull(twoFactorTable.expiresAt)))

      if (!twoFactor) {
        return badRequest('잘못된 인증 코드예요')
      }

      const secret = decryptTOTPSecret(twoFactor.secret)

      if (!(await verifyTOTPToken(token, secret))) {
        return badRequest('잘못된 인증 코드예요')
      }

      const { codes, hashedCodes } = await generateBackupCodes(8)

      const backupCodeValues = hashedCodes.map((codeHash) => ({
        userId,
        codeHash,
      }))

      await tx
        .with(
          tx
            .$with('delete_old_codes')
            .as(tx.delete(twoFactorBackupCodeTable).where(eq(twoFactorBackupCodeTable.userId, userId))),
        )
        .insert(twoFactorBackupCodeTable)
        .values(backupCodeValues)

      return ok(codes)
    })

    return result
  } catch (error) {
    captureException(error, { tags: { action: 'regenerateBackupCodes' } })
    return badRequest('복구 코드 재생성 중 오류가 발생했어요')
  }
}

export async function removeTwoFactor(formData: FormData) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = tokenSchema.safeParse({ token: formData.get('token') })

  if (!validation.success) {
    return badRequest('잘못된 인증 코드예요')
  }

  const { token } = validation.data

  try {
    const result = await db.transaction(async (tx) => {
      const [twoFactor] = await tx
        .select({ secret: twoFactorTable.secret })
        .from(twoFactorTable)
        .where(and(eq(twoFactorTable.userId, userId), isNull(twoFactorTable.expiresAt)))

      if (!twoFactor) {
        return badRequest('잘못된 인증 코드예요')
      }

      const secret = decryptTOTPSecret(twoFactor.secret)

      if (!(await verifyTOTPToken(token, secret))) {
        return badRequest('잘못된 인증 코드예요')
      }

      await tx
        .with(tx.$with('delete_old_codes').as(tx.delete(twoFactorTable).where(eq(twoFactorTable.userId, userId))))
        .delete(twoFactorBackupCodeTable)
        .where(eq(twoFactorBackupCodeTable.userId, userId))

      return noContent()
    })

    return result
  } catch (error) {
    captureException(error, { tags: { action: 'removeTwoFactor' } })
    return badRequest('2단계 인증 비활성화 중 오류가 발생했어요', formData)
  }
}
