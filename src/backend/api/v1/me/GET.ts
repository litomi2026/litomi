import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'

import { Env } from '@/backend'
import { clearAuthCookies } from '@/backend/utils/auth'
import { privateCacheControl } from '@/backend/utils/cache-control'
import { problemResponse } from '@/backend/utils/problem'
import { bbatonVerificationTable } from '@/database/supabase/bbaton'
import { db } from '@/database/supabase/drizzle'
import { userSettingsTable, userTable } from '@/database/supabase/user'
import { resolveUserSettings, type UserSettings } from '@/utils/user-settings'

export type AdultVerificationStatus = 'adult' | 'not_adult' | 'unverified'

export type GETV1MeResponse = {
  id: number
  loginId: string
  name: string
  nickname: string
  imageURL: string | null
  adultVerification: {
    required: boolean
    status: AdultVerificationStatus
  }
  settings: UserSettings
}

const route = new Hono<Env>()

route.get('/', async (c) => {
  const userId = c.get('userId')!

  try {
    const [user] = await db
      .select({
        id: userTable.id,
        loginId: userTable.loginId,
        name: userTable.name,
        nickname: userTable.nickname,
        imageURL: userTable.imageURL,
        adultFlag: bbatonVerificationTable.adultFlag,
        historySyncEnabled: userSettingsTable.historySyncEnabled,
        adultVerifiedAdVisible: userSettingsTable.adultVerifiedAdVisible,
        autoDeletionDay: userSettingsTable.autoDeletionDay,

        // TODO(2026-04-02): 마이그레이션 후 autoDeletionDays 컬럼 삭제
        fallbackAutoDeletionDay: userTable.autoDeletionDays,
      })
      .from(userTable)
      .leftJoin(bbatonVerificationTable, eq(bbatonVerificationTable.userId, userTable.id))
      .leftJoin(userSettingsTable, eq(userSettingsTable.userId, userTable.id))
      .where(eq(userTable.id, userId))

    if (!user) {
      clearAuthCookies(c)
      return problemResponse(c, { status: 404, detail: '사용자 정보를 찾을 수 없어요' })
    }

    const country = c.req.header('CF-IPCountry')?.trim().toUpperCase() ?? 'KR'
    const required = country === 'KR'
    const isAdult = c.get('isAdult') === true
    const status: AdultVerificationStatus = isAdult ? 'adult' : user.adultFlag === false ? 'not_adult' : 'unverified'

    const settings = resolveUserSettings({
      historySyncEnabled: user.historySyncEnabled ?? undefined,
      adultVerifiedAdVisible: user.adultVerifiedAdVisible ?? undefined,

      // TODO(2026-04-02): 마이그레이션 후 autoDeletionDays 컬럼 삭제
      autoDeletionDay: user.autoDeletionDay ?? user.fallbackAutoDeletionDay ?? undefined,
    })

    const result: GETV1MeResponse = {
      id: user.id,
      loginId: user.loginId,
      name: user.name,
      nickname: user.nickname,
      imageURL: user.imageURL,
      adultVerification: { required, status },
      settings,
    }

    return c.json<GETV1MeResponse>(result, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '사용자 정보를 불러오지 못했어요' })
  }
})

export default route
