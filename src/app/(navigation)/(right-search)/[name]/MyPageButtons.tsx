import { ErrorBoundary } from '@suspensive/react'
import { Suspense } from 'react'

import LogoutButton from '@/app/(navigation)/LogoutButton'
import { getUserIdFromCookie } from '@/utils/cookie'

import FollowButton from '../post/[id]/@post/FollowButton'
import { getMe } from './common'
import ProfileEditButton, { ProfileEditButtonError, ProfileEditButtonSkeleton } from './ProfileEditButton'

type Props = {
  user: {
    id: number
    name: string
    isFollowedByCurrentUser?: boolean
  }
}

export default async function MyPageButtons({ user }: Props) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return null
  }

  if (user.id !== userId) {
    return <FollowButton initialFollowing={user.isFollowedByCurrentUser} leader={user} />
  }

  const loginUser = getMe(userId)

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
