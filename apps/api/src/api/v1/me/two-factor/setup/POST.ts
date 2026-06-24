import { encryptTOTPSecret, generateQRCode, TOTP_CONFIG } from '@litomi/auth/two-factor'
import type { POSTV1MeTwoFactorSetupResponse } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { twoFactorTable } from '@litomi/db/app/two-factor'
import { userTable } from '@litomi/db/app/user'
import { eq, isNotNull } from 'drizzle-orm'
import { Hono } from 'hono'
import ms from 'ms'
import { generateSecret, generateURI } from 'otplib'

import type { Env } from '@/app'

import { problemResponse, tooManyRequestsProblemResponse } from '@/utils/problem'
import { RedisRateLimiter, RedisRateLimitPresets } from '@/utils/rate-limit'

const twoFactorSetupLimiter = new RedisRateLimiter({
  ...RedisRateLimitPresets.strict(),
  scope: 'me-two-factor-setup:user',
})

const route = new Hono<Env>()

route.post('/', async (c) => {
  const userId = c.get('userId')!
  const { allowed, retryAfter } = await twoFactorSetupLimiter.check(String(userId))

  if (!allowed) {
    return tooManyRequestsProblemResponse(c, retryAfter)
  }

  try {
    const rawSecret = generateSecret()
    const encryptedSecret = encryptTOTPSecret(rawSecret)
    const expiresAt = new Date(Date.now() + ms('5 minutes'))
    const expiresAtString = expiresAt.toISOString()

    const [user] = await db.select({ loginId: userTable.loginId }).from(userTable).where(eq(userTable.id, userId))

    if (!user) {
      return problemResponse(c, { status: 404, detail: '사용자를 찾을 수 없어요' })
    }

    const [setup] = await db
      .insert(twoFactorTable)
      .values({
        userId,
        secret: encryptedSecret,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: twoFactorTable.userId,
        set: {
          secret: encryptedSecret,
          expiresAt,
        },
        setWhere: isNotNull(twoFactorTable.expiresAt),
      })
      .returning({ expiresAt: twoFactorTable.expiresAt })

    if (!setup) {
      return problemResponse(c, { status: 409, detail: '이미 2단계 인증이 활성화됐어요' })
    }

    const keyURI = generateURI({
      issuer: TOTP_CONFIG.issuer,
      label: user.loginId,
      secret: rawSecret,
    })

    const qrCodeDataURL = await generateQRCode(keyURI)

    return c.json<POSTV1MeTwoFactorSetupResponse>({
      qrCode: qrCodeDataURL,
      secret: rawSecret,
      expiresAt: expiresAtString,
    })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '2단계 인증 설정 중 오류가 발생했어요' })
  }
})

export default route
