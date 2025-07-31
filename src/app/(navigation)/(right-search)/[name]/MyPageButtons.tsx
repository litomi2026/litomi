import { ErrorBoundary } from '@suspensive/react'
import { cookies } from 'next/headers'
import { Suspense } from 'react'

import LogoutButton from '@/components/header/LogoutButton'
import { getUserIdFromAccessToken } from '@/utils/cookie'

import { getUserById } from './common'
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
