import { zValidator } from '@hono/zod-validator'
// import { compare } from 'bcrypt'
import { and, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { deleteCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { getUserId } from '@/backend/utils/auth'
import { COOKIE_DOMAIN } from '@/constants'
import { CookieKey } from '@/constants/storage'
import { bbatonVerificationTable } from '@/database/supabase/bbaton'
import { db } from '@/database/supabase/drizzle'
import { twoFactorTable } from '@/database/supabase/two-factor'
import { userTable } from '@/database/supabase/user'
import { passwordSchema } from '@/database/zod'
import { decryptTOTPSecret, verifyTOTPToken } from '@/utils/two-factor'

export type POSTV1BBatonUnlinkResponse = { ok: true }

const schema = z.object({
  password: passwordSchema,
  token: z.string().length(6).regex(/^\d+$/).optional(),
})

const route = new Hono<Env>()

route.post('/', zValidator('json', schema), async (c) => {
  const userId = getUserId()

  if (!userId) {
    throw new HTTPException(401, { message: '로그인이 필요해요' })
  }

  const { password, token } = c.req.valid('json')

  const [user] = await db
    .select({ passwordHash: userTable.passwordHash })
    .from(userTable)
    .where(eq(userTable.id, userId))

  if (!user) {
    throw new HTTPException(401, { message: '비밀번호가 일치하지 않아요' })
  }

  // const isValidPassword = await compare(password, user.passwordHash).catch(() => false)

  // if (!isValidPassword) {
  //   throw new HTTPException(401, { message: '비밀번호가 일치하지 않아요' })
  // }

  const [twoFactor] = await db
    .select({ secret: twoFactorTable.secret })
    .from(twoFactorTable)
    .where(and(eq(twoFactorTable.userId, userId), isNull(twoFactorTable.expiresAt)))

  if (twoFactor) {
    if (!token) {
      throw new HTTPException(400, { message: '2단계 인증 코드가 필요해요' })
    }

    const secret = decryptTOTPSecret(twoFactor.secret)
    const isValidToken = verifyTOTPToken(token, secret)

    if (!isValidToken) {
      throw new HTTPException(400, { message: '잘못된 인증 코드예요' })
    }
  }

  await db.delete(bbatonVerificationTable).where(eq(bbatonVerificationTable.userId, userId))

  deleteCookie(c, CookieKey.BBATON_ATTEMPT_ID, { domain: COOKIE_DOMAIN, path: '/api/v1/bbaton' })

  return c.json<POSTV1BBatonUnlinkResponse>({ ok: true })
})

export default route
