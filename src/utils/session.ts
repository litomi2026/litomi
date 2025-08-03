import { cookies } from 'next/headers'

import { getUserIdFromAccessToken } from './cookie'

export async function getUserIdFromCookie() {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

  if (!userId) {
    return null
  }

  return userId
}
