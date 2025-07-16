import { sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { SearchParamKey } from '@/constants/storage'
import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'
import { getUserDataFromAccessToken } from '@/utils/cookie'

import { GETMyRequestSchema } from './schema'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const searchParams = Object.fromEntries(url.searchParams)
  const validation = GETMyRequestSchema.safeParse(searchParams)

  if (!validation.success) {
    return new Response('400 Bad Request', { status: 400 })
  }

  const { tab } = validation.data
  const cookieStore = await cookies()
  const { userId } = (await getUserDataFromAccessToken(cookieStore)) ?? {}

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
