import { ErrorBoundary } from '@suspensive/react'
import { Suspense } from 'react'

import LogoutButton from '@/app/(navigation)/LogoutButton'
import { getUserIdFromCookie } from '@/utils/cookie'

import { getUserById } from './common'
import ProfileEditButton, { ProfileEditButtonError, ProfileEditButtonSkeleton } from './ProfileEditButton'

type Props = {
  user: { id?: number }
}

export default async function MyPageButtons({ user }: Readonly<Props>) {
  const userId = await getUserIdFromCookie()

  // NOTE: 로그인하지 않은 경우
  if (!userId) {
    return null
  }

  // NOTE: 로그인한 사용자와 name이 다른 경우
  if (user.id !== userId) {
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
