'use server'

import { captureException } from '@sentry/nextjs'
import { and, eq, gt, isNull, sql } from 'drizzle-orm'
import ms from 'ms'
import { authenticator } from 'otplib'
import { z } from 'zod'

import { TOTP_ISSUER } from '@/constants'
import { db } from '@/database/supabase/drizzle'
import { twoFactorBackupCodeTable, twoFactorTable } from '@/database/supabase/two-factor'
import { userTable } from '@/database/supabase/user'
import { badRequest, forbidden, internalServerError, noContent, ok, unauthorized } from '@/utils/action-response'
import { validateUserIdFromCookie } from '@/utils/cookie'
import {
  decryptTOTPSecret,
  encryptTOTPSecret,
  generateBackupCodes,
  generateQRCode,
  verifyTOTPToken,
} from '@/utils/two-factor'

const tokenSchema = z.object({
  token: z.string().length(6).regex(/^\d+$/),
})

export async function regenerateBackupCodes(formData: FormData) {
  const userId = await validateUserIdFromCookie()

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

      if (!verifyTOTPToken(token, secret)) {
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
  const userId = await validateUserIdFromCookie()

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

      if (!verifyTOTPToken(token, secret)) {
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

export async function setupTwoFactor() {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  try {
    const rawSecret = authenticator.generateSecret()
    const encryptedSecret = encryptTOTPSecret(rawSecret)
    const expiresAt = new Date(Date.now() + ms('5 minutes'))
    const expiresAtString = expiresAt.toISOString()

    const result = await db.execute<{
      user_id: number
      expires_at: Date | null
      login_id: string
      was_updated: boolean
    }>(sql`
      WITH user_info AS (
        SELECT ${userTable.id}, ${userTable.loginId} FROM ${userTable} WHERE ${userTable.id} = ${userId}
      ),
      upsert_result AS (
        INSERT INTO ${twoFactorTable} (user_id, secret, expires_at)
        SELECT ${userId}, ${encryptedSecret}, ${expiresAtString}
        FROM user_info
        ON CONFLICT (user_id) DO UPDATE
        SET 
          secret = CASE 
            WHEN ${twoFactorTable}.expires_at IS NOT NULL THEN EXCLUDED.secret
            ELSE ${twoFactorTable}.secret
          END,
          expires_at = CASE 
            WHEN ${twoFactorTable}.expires_at IS NOT NULL THEN EXCLUDED.expires_at
            ELSE ${twoFactorTable}.expires_at
          END
        RETURNING 
          ${twoFactorTable.userId},
          ${twoFactorTable.expiresAt},
          (${twoFactorTable.expiresAt} IS NOT NULL) AS was_updated
      )
      SELECT 
        ur.user_id,
        ur.expires_at,
        ur.was_updated,
        ui.login_id
      FROM upsert_result ur
      CROSS JOIN user_info ui
      WHERE ur.was_updated = true OR ur.expires_at = ${expiresAtString}
    `)

    const loginId = result[0].login_id

    if (!loginId) {
      return forbidden('2단계 인증을 설정할 수 없어요')
    }

    const keyURI = authenticator.keyuri(loginId, TOTP_ISSUER, rawSecret)
    const qrCodeDataURL = await generateQRCode(keyURI)

    return ok({
      qrCode: qrCodeDataURL,
      secret: rawSecret,
      expiresAt,
    })
  } catch (error) {
    captureException(error, { tags: { action: 'setupTwoFactor' } })
    return internalServerError('2단계 인증 설정 중 오류가 발생했어요')
  }
}

export async function verifyAndEnableTwoFactor(formData: FormData) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = tokenSchema.safeParse({ token: formData.get('token') })

  if (!validation.success) {
    return badRequest('잘못된 인증 코드예요', formData)
  }

  const { token } = validation.data

  try {
    const result = await db.transaction(async (tx) => {
      const [setup] = await tx
        .select({ secret: twoFactorTable.secret })
        .from(twoFactorTable)
        .where(and(eq(twoFactorTable.userId, userId), gt(twoFactorTable.expiresAt, new Date())))

      if (!setup) {
        return forbidden('2단계 인증 설정이 만료됐어요')
      }

      const secret = decryptTOTPSecret(setup.secret)

      if (!verifyTOTPToken(token, secret)) {
        return badRequest('잘못된 인증 코드예요')
      }

      const { codes, hashedCodes } = await generateBackupCodes(8)

      const backupCodeValues = hashedCodes.map((codeHash) => ({
        userId,
        codeHash,
      }))

      const enableCTE = db
        .$with('enable_2fa')
        .as(
          db
            .update(twoFactorTable)
            .set({ expiresAt: null })
            .where(eq(twoFactorTable.userId, userId))
            .returning({ userId: twoFactorTable.userId }),
        )

      const backupCodesCTE = db
        .$with('insert_backup_codes')
        .as(
          db
            .insert(twoFactorBackupCodeTable)
            .values(backupCodeValues)
            .returning({ userId: twoFactorBackupCodeTable.userId }),
        )

      const [result] = await tx.with(enableCTE, backupCodesCTE).select({ userId: enableCTE.userId }).from(enableCTE)

      if (!result) {
        return internalServerError('2단계 인증 활성화 중 오류가 발생했어요')
      }

      return ok(codes)
    })

    return result
  } catch (error) {
    captureException(error, { tags: { action: 'verifyAndEnableTwoFactor' } })
    return badRequest('2단계 인증 활성화 중 오류가 발생했어요', formData)
  }
}
