import { ErrorBoundary } from '@suspensive/react'
import { Suspense } from 'react'

import LogoutButton from '@/app/(navigation)/LogoutButton'
import { getUserIdFromCookie } from '@/utils/cookie'

import FollowButton from '../post/[id]/FollowButton'
import { getMe } from './common'
import ProfileEditButton, { ProfileEditButtonError, ProfileEditButtonSkeleton } from './ProfileEditButton'
import { UserType } from './UserProfileView'

type Props = {
  user: {
    id: number
    name: string
    isFollowedByCurrentUser?: boolean
    type?: UserType
  }
}

export default async function MyPageButtons({ user }: Props) {
  const userId = await getUserIdFromCookie()

  if (!userId || user.type === UserType.GUEST || user.type === UserType.NOT_FOUND) {
    return null
  }

  if (user.id !== userId) {
    return <FollowButton initialFollowing={user.isFollowedByCurrentUser} leader={user} />
  }

  const currentUser = getMe(userId)

  return (
    <div className="flex items-center gap-2">
      <ErrorBoundary fallback={ProfileEditButtonError}>
        <Suspense fallback={<ProfileEditButtonSkeleton />}>
          <ProfileEditButton mePromise={currentUser} />
        </Suspense>
      </ErrorBoundary>
      <LogoutButton />
    </div>
  )
}
