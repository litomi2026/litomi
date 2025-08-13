import { ErrorBoundary } from '@suspensive/react'
import { cookies } from 'next/headers'
import { Suspense } from 'react'

import LogoutButton from '@/components/header/LogoutButton'
import { getUserIdFromAccessToken } from '@/utils/cookie'

import { getUserById } from './common'
import ProfileEditButton, { ProfileEditButtonError, ProfileEditButtonSkeleton } from './ProfileEditButton'

type Props = {
  user: { id?: number }
}

export default async function MyPageButtons({ user }: Readonly<Props>) {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore, false)

  // NOTE: 로그인하지 않은 경우
  if (!userId) {
    return null
  }

  // NOTE: 로그인한 사용자와 name이 다른 경우
  if (user.id?.toString() !== userId) {
    return null
  }

  const loginUser = getUserById(userId)

  return (
    <div className="flex items-center gap-2">
      <ErrorBoundary fallback={ProfileEditButtonError}>
        <Suspense fallback={<ProfileEditButtonSkeleton />}>
          <ProfileEditButton mePromise={loginUser} />
        </Suspense>
      </ErrorBoundary>
      <LogoutButton />
    </div>
  )
}
