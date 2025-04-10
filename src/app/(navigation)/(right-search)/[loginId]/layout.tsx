import LogoutButton, { LogoutButtonError, LogoutButtonSkeleton } from '@/components/header/LogoutButton'
import IconCalendar from '@/components/icons/IconCalendar'
import selectUser from '@/sql/selectUser'
import { BaseLayoutProps } from '@/types/nextjs'
import { getLoginId } from '@/utils/param'
import { ErrorBoundary, Suspense } from '@suspensive/react'
import dayjs from 'dayjs'
import { unstable_cache } from 'next/cache'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import MyPageNavigation from './MyPageNavigation'

export default async function Layout({ params, children }: BaseLayoutProps) {
  const { loginId } = await params
  const decodedLoginId = getLoginId(loginId)

  if (!decodedLoginId) {
    notFound()
  }

  const [user] = await getUser(decodedLoginId)()

  if (!user) {
    notFound()
  }

  return (
    <main className="flex flex-col grow">
      {/* Cover Image */}
      <div className="relative h-48 w-full shrink-0">
        <Image
          alt="Cover Image"
          className="object-cover"
          fill
          sizes="100vw, (min-width: 1024px) 1024px"
          src="/og-image.png"
        />
      </div>
      {/* 프로필 정보 영역 */}
      <div className="grid gap-4 px-4">
        <div className="relative -mt-16 flex justify-between items-end">
          <div className="flex items-end">
            <div className="w-32 aspect-square shrink-0 border-4 rounded-full overflow-hidden">
              <img alt="Profile Image" className="object-cover aspect-square w-32" src={user.imageURL ?? ''} />
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold line-clamp-1 break-all">{user.nickname}</h1>
              <p className="text-zinc-500 font-mono break-all">@{decodedLoginId}</p>
            </div>
          </div>
          <ErrorBoundary fallback={LogoutButtonError}>
            <Suspense clientOnly fallback={<LogoutButtonSkeleton />}>
              <LogoutButton />
            </Suspense>
          </ErrorBoundary>
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
      <MyPageNavigation loginId={decodedLoginId} />
      {children}
    </main>
  )
}

function getUser(loginId: string) {
  return unstable_cache(() => selectUser({ loginId }), [loginId], {
    tags: [loginId],
    revalidate: 300,
  })
}
