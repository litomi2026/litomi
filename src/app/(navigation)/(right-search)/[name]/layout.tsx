import { Suspense } from 'react'

import { LayoutProps } from '@/types/nextjs'
import { getUsernameFromParam } from '@/utils/param'

import MyPageNavigationLink from './MyPageNavigationLink'
import MyPagePrivateNavigation from './MyPagePrivateNavigation'
import UserProfile from './UserProfile'
import UserProfileView, { UserType } from './UserProfileView'

export default async function Layout({ params, children }: LayoutProps) {
  const { name } = await params
  const username = getUsernameFromParam(name)

  const publicLinks = [
    { href: `/@${username}`, label: '게시글' },
    { href: `/@${username}/bookmark`, label: '북마크' },
  ]

  return (
    <main className="flex flex-col grow">
      <Suspense fallback={<UserProfileView user={{ type: UserType.LOADING, name: username, nickname: '...' }} />}>
        <UserProfile username={username} />
      </Suspense>
      <nav
        className="sticky top-0 z-20 min-h-12.5 border-b-2 bg-background font-semibold
        [&_a]:min-w-16 [&_a]:group [&_a]:relative [&_a]:flex [&_a]:justify-center [&_a]:items-center [&_a]:gap-1 [&_a]:p-3 [&_a]:transition"
      >
        <div className="relative h-full overflow-hidden">
          <div className="absolute inset-0 overflow-x-auto scrollbar-hidden">
            <div className="inline-flex gap-4 px-3 whitespace-nowrap text-zinc-600">
              {publicLinks.map(({ href, label }) => (
                <MyPageNavigationLink href={href} key={href} label={label} />
              ))}
              <MyPagePrivateNavigation username={username} />
            </div>
          </div>
        </div>
      </nav>
      {children}
    </main>
  )
}
