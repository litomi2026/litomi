'use client'

import dynamic from 'next/dynamic'

import useMeQuery from '@/query/useMeQuery'

import LogoutButton from '../../LogoutButton'

type Props = {
  user: {
    id: number
    name: string
  }
}

const FollowButton = dynamic(() => import('../post/[id]/FollowButton'))
const ProfileEditButton = dynamic(() => import('./ProfileEditButton'), { loading: ProfileEditButtonSkeleton })

export default function MyPageButtons({ user }: Props) {
  const { data: me } = useMeQuery()

  if (me === undefined) {
    return <ProfileEditButtonSkeleton />
  }

  if (me === null) {
    return null
  }

  if (user.id !== me.id) {
    return <FollowButton leader={user} />
  }

  return (
    <div className="flex items-center gap-2">
      <ProfileEditButton me={me} />
      <LogoutButton username={me.name} />
    </div>
  )
}

function ProfileEditButtonSkeleton() {
  return <div className="w-9 h-9 animate-fade-in bg-zinc-800 rounded-full md:w-29" />
}
