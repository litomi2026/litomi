import LogoutButton from '@/components/header/LogoutButton'
import IconCalendar from '@/components/icons/IconCalendar'
import { BaseLayoutProps } from '@/types/nextjs'
import { getUserId } from '@/utils/param'
import dayjs from 'dayjs'
import Image from 'next/image'
import Link from 'next/link'

// 예시 데이터를 사용합니다. 실제 서비스에서는 API 호출 등을 통해 데이터를 가져오세요.
const getUserData = async (username: string) => {
  return {
    username,
    displayName: 'John Doe',
    joinDate: new Date(),
    followingCount: 123,
    followersCount: 456,
    coverImageUrl: '/og-image.png',
    profileImageUrl: '/web-app-manifest-192x192.png',
  }
}

export default async function Layout({ params, children }: BaseLayoutProps) {
  const { userId } = await params
  const user = await getUserData(getUserId(userId))

  return (
    <main className="flex flex-col grow">
      {/* Cover Image */}
      <div className="relative h-48 w-full shrink-0">
        <Image
          alt="Cover Image"
          className="object-cover"
          fill
          sizes="100vw, (min-width: 1024px) 1024px"
          src={user.coverImageUrl}
        />
      </div>
      {/* 프로필 정보 영역 */}
      <div className="grid gap-4 px-4 relative">
        <div className="relative -mt-16 flex justify-between items-end">
          {/* Profile Image */}
          <div className="flex items-end">
            <div className="w-32 aspect-square shrink-0 border-4 rounded-full overflow-hidden">
              <Image alt="Profile Image" className="object-cover" height={128} src={user.profileImageUrl} width={128} />
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold line-clamp-1">{user.displayName}</h1>
              <p className="text-zinc-500 font-mono break-all">@{user.username}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
        {/* 상세 정보 */}
        <div>
          <div className="mt-2 flex items-center gap-1 text-zinc-500 text-sm">
            <IconCalendar className="w-4" /> 가입일: {dayjs(user.joinDate).format('YYYY년 M월')}
          </div>
          <div className="mt-4 flex gap-6">
            <div className="flex gap-2">
              <span className="font-bold">{user.followingCount}</span>
              <span className="text-zinc-500">팔로우 중</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">{user.followersCount}</span>
              <span className="text-zinc-500">팔로워</span>
            </div>
          </div>
        </div>
        {/* 네비게이션 탭 */}
      </div>
      <nav
        className="sticky top-0 z-20 border-b-2 flex gap-6 mt-2 bg-background/70 backdrop-blur
          [&_a]:block [&_a]:mx-3 [&_a]:transition [&_a]:min-w-4 [&_a]:p-2.5 [&_a]:text-center [&_a]:text-zinc-600 [&_a]:border-b-4 [&_a]:border-transparent 
          [&_a]:hover:border-zinc-500 [&_a]:hover:font-bold [&_a]:hover:text-foreground [&_a]:aria-current:border-zinc-500 [&_a]:aria-current:font-bold [&_a]:aria-current:text-foreground"
      >
        <Link aria-current href={`/@${user.username}`}>
          게시글
        </Link>
        <Link href={`/@${user.username}/reply`}>답글</Link>
        <Link href={`/@${user.username}/bookmark`}>북마크</Link>
      </nav>
      {children}
    </main>
  )
}
