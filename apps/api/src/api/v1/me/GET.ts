import { getAuthCookieClearConfigs } from '@litomi/auth/cookie'
import { bbatonVerificationTable } from '@litomi/db/database/app/bbaton'
import 'server-only'
import { db } from '@litomi/db/database/app/drizzle'
import { userSettingsTable, userTable } from '@litomi/db/database/app/user'
import { resolveUserSettings, type UserSettings } from '@litomi/domain/utils/user-settings'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { privateCacheControl } from '@/utils/cache-control'
import { applyAuthCookie } from '@/utils/cookie'
import { problemResponse } from '@/utils/problem'

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
        defaultCensorshipEnabled: userSettingsTable.defaultCensorshipEnabled,
        autoDeletionDay: userSettingsTable.autoDeletionDay,
      })
      .from(userTable)
      .leftJoin(bbatonVerificationTable, eq(bbatonVerificationTable.userId, userTable.id))
      .leftJoin(userSettingsTable, eq(userSettingsTable.userId, userTable.id))
      .where(eq(userTable.id, userId))

    if (!user) {
      applyAuthCookie(c, getAuthCookieClearConfigs())
      return problemResponse(c, { status: 404, detail: '사용자 정보를 찾을 수 없어요' })
    }

    const country = c.req.header('CF-IPCountry')?.trim().toUpperCase() ?? 'KR'
    const required = country === 'KR'
    const isAdult = c.get('isAdult') === true
    const status: AdultVerificationStatus = isAdult ? 'adult' : user.adultFlag === false ? 'not_adult' : 'unverified'

    const settings = resolveUserSettings({
      historySyncEnabled: user.historySyncEnabled ?? undefined,
      adultVerifiedAdVisible: user.adultVerifiedAdVisible ?? undefined,
      defaultCensorshipEnabled: user.defaultCensorshipEnabled ?? undefined,
      autoDeletionDay: user.autoDeletionDay ?? undefined,
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
