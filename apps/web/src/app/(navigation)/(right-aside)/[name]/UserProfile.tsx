import dayjs from 'dayjs'
import { Calendar, User } from 'lucide-react'
import Image from 'next/image'

import MyPageButtons from './MyPageButtons'
import { getPublicUserProfile, type PublicUserProfile } from './profile'
import UserProfileIdentity from './UserProfileIdentity'

type Props = {
  username: string
}

export default async function UserProfile({ username }: Props) {
  const profile = username ? await getPublicUserProfile(username) : null

  return (
    <>
      <div className="relative h-48 w-full shrink-0">
        <Image
          alt="Cover Image"
          className="object-cover"
          fill
          priority
          sizes="100vw, (min-width: 1024px) 1024px"
          src="/og-image.avif"
        />
      </div>
      <div className="grid gap-4 px-4 pb-2">
        <div className="relative -mt-16 flex justify-between items-end">
          {profile ? (
            <>
              <UserProfileIdentity user={profile} />
              <MyPageButtons user={profile} />
            </>
          ) : (
            <StaticUserProfileIdentity name={username} nickname={username ? '존재하지 않는 사용자' : '비회원'} />
          )}
        </div>
        <UserProfileDescription profile={profile} username={username} />
      </div>
    </>
  )
}

function StaticUserProfileIdentity({ name, nickname }: { name: string; nickname: string }) {
  return (
    <div className="flex items-end">
      <div className="w-32 aspect-square shrink-0 border-4 rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center">
        <User className="size-2/3 shrink-0 text-zinc-700" />
      </div>
      <div className="ml-4">
        <h1 className="text-2xl font-bold line-clamp-1 break-all">{nickname}</h1>
        <p className="text-zinc-500 font-mono break-all">@{name}</p>
      </div>
    </div>
  )
}

function UserProfileDescription({ profile, username }: { profile: PublicUserProfile | null; username: string }) {
  if (!username) {
    return <div className="mt-2 h-19 text-zinc-500 text-sm">로그인하면 모든 기능을 이용할 수 있어요</div>
  }

  if (!profile) {
    return <div className="mt-2 h-19 text-zinc-500 text-sm">존재하지 않는 사용자예요</div>
  }

  return (
    <>
      <div className="mt-2 flex items-center gap-1 text-zinc-500 text-sm">
        <Calendar className="size-4" /> 가입일: {dayjs(profile.createdAt).format('YYYY년 M월')}
      </div>
      <div className="mt-4 flex gap-6">
        <div className="flex gap-2">
          <span className="font-bold">{profile.followingCount ?? '.'}</span>
          <span className="text-zinc-500">팔로우 중</span>
        </div>
        <div className="flex gap-2">
          <span className="font-bold">{profile.followerCount ?? '.'}</span>
          <span className="text-zinc-500">팔로워</span>
        </div>
      </div>
    </>
  )
}
