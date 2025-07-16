import { ErrorBoundary } from '@suspensive/react'
import dayjs from 'dayjs'
import { unstable_cache } from 'next/cache'
import Image from 'next/image'
import { Suspense } from 'react'

import LogoutButton, { LogoutButtonError, LogoutButtonSkeleton } from '@/components/header/LogoutButton'
import IconCalendar from '@/components/icons/IconCalendar'
import selectUser from '@/sql/selectUser'
import { LayoutProps } from '@/types/nextjs'
import { getLoginIdFromParam } from '@/utils/param'

import MyPageNavigation from './MyPageNavigation'
import ProfileEditButton, { ProfileEditButtonError, ProfileEditButtonSkeleton } from './ProfileEditButton'
import UserBadRequest from './UserBadRequest'
import UserNotFound from './UserNotFound'

export default async function Layout({ params, children }: LayoutProps) {
  const { loginId } = await params
  const loginIdFromParam = getLoginIdFromParam(loginId)

  if (!loginIdFromParam) {
    return <UserBadRequest />
  }

  const [user] = await getUser(loginIdFromParam)()

  if (!user) {
    return <UserNotFound />
  }

  return (
    <main className="flex flex-col grow">
      {/* Cover Image */}
      <div className="relative h-48 w-full shrink-0">
        <Image
          alt="Cover Image"
          className="object-cover"
          fill
          priority
          sizes="100vw, (min-width: 1024px) 1024px"
          src="/og-image.png"
        />
      </div>
      {/* 프로필 정보 영역 */}
      <div className="grid gap-4 px-4">
        <div className="relative -mt-16 flex justify-between items-end">
          <div className="flex items-end">
            <div className="w-32 aspect-square shrink-0 border-4 rounded-full overflow-hidden">
              <img
                alt="Profile Image"
                className="object-cover bg-zinc-900 aspect-square w-32"
                src={user.imageURL ?? ''}
              />
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold line-clamp-1 break-all">{user.nickname}</h1>
              <p className="text-zinc-500 font-mono break-all">@{loginIdFromParam}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ErrorBoundary fallback={ProfileEditButtonError}>
              <Suspense fallback={<ProfileEditButtonSkeleton />}>
                <ProfileEditButton />
              </Suspense>
            </ErrorBoundary>
            <ErrorBoundary fallback={LogoutButtonError}>
              <Suspense fallback={<LogoutButtonSkeleton />}>
                <LogoutButton />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
        <div>
          <div className="mt-2 flex items-center gap-1 text-zinc-500 text-sm">
            <IconCalendar className="w-4" /> 가입일: {dayjs(user.createdAt).format('YYYY년 M월')}
          </div>
          <div className="mt-4 flex gap-6">
            <div className="flex gap-2">
              <span className="font-bold">{123}</span>
              <span className="text-zinc-500">팔로우 중</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">{456}</span>
              <span className="text-zinc-500">팔로워</span>
            </div>
          </div>
        </div>
      </div>
      {/* 네비게이션 탭 */}
      <MyPageNavigation loginId={loginIdFromParam} />
      {children}
    </main>
  )
}

function getUser(loginId: string) {
  return unstable_cache(() => selectUser({ loginId }), [loginId], {
    tags: [loginId],
    revalidate: 30,
  })
}
