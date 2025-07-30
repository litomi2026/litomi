import { ErrorBoundary } from '@suspensive/react'
import { sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { cache, Suspense } from 'react'

import LogoutButton from '@/components/header/LogoutButton'
import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'
import { getUserIdFromAccessToken } from '@/utils/cookie'

import ProfileEditButton, { ProfileEditButtonError, ProfileEditButtonSkeleton } from './ProfileEditButton'

export default async function MyPageButtons() {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore, false)

  if (!userId) {
    return null
  }

  const user = getUserById(userId)

  return (
    <div className="flex items-center gap-2">
      <ErrorBoundary fallback={ProfileEditButtonError}>
        <Suspense fallback={<ProfileEditButtonSkeleton />}>
          <ProfileEditButton mePromise={user} />
        </Suspense>
      </ErrorBoundary>
      <LogoutButton />
    </div>
  )
}

const getUserById = cache(async (userId: string) => {
  const [user] = await db
    .select({
      loginId: userTable.loginId,
      name: userTable.name,
      nickname: userTable.nickname,
      imageURL: userTable.imageURL,
    })
    .from(userTable)
    .where(sql`${userTable.id} = ${userId}`)

  return user
})
