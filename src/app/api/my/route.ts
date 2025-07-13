import { sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

import { SearchParamKey } from '@/constants/storage'
import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'
import { getUserIdFromAccessToken } from '@/utils/cookie'

import { GETMyRequestSchema } from './schema'

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams)
  const validation = GETMyRequestSchema.safeParse(params)

  if (!validation.success) {
    return new Response('400 Bad Request', { status: 400 })
  }

  const { tab } = validation.data
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

  if (!userId) {
    const redirectURL = tab ? `/api/my?tab=${tab}` : '/api/my'
    redirect(`/auth/login?${SearchParamKey.REDIRECT_URL}=${encodeURIComponent(redirectURL)}`)
  }

  const [user] = await db
    .select({ loginId: userTable.loginId })
    .from(userTable)
    .where(sql`${userTable.id} = ${userId}`)

  if (!user) {
    return new Response('404 Not Found', { status: 404 })
  }

  const path = tab ? `/${tab}` : ''
  redirect(`/@${user.loginId}${path}`)
}
