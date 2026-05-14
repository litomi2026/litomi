import { Suspense } from 'react'

import { TopStickySafeAreaSurface } from '@/components/SafeAreaSurface'
import { MobileNavigationSpacer } from '@/components/ScrollSpacers'
import { getUsernameFromParam } from '@/utils/param'

import MyPageNavigationLink from './MyPageNavigationLink'
import MyPagePrivateNavigation from './MyPagePrivateNavigation'
import UserProfile from './UserProfile'
import UserProfileView, { UserType } from './UserProfileView'

export default async function Layout({ params, children }: LayoutProps<'/[name]'>) {
  const { name } = await params
  const username = getUsernameFromParam(name)
  const publicLinks = [{ href: `/@${username}`, label: '이야기' }]

  const loadingUser = {
    id: 0,
    name: username,
    nickname: '...',
    type: UserType.LOADING,
  }

  return (
    <main className="flex flex-col grow">
      <Suspense fallback={<UserProfileView user={loadingUser} />}>
        <UserProfile username={username} />
      </Suspense>
      <TopStickySafeAreaSurface />
      <nav
        className="sticky top-(--safe-area-top) min-h-(--safe-area-top) z-30 overflow-x-auto scrollbar-hidden border-b bg-background font-semibold
        [&_a]:min-w-16 [&_a]:group [&_a]:relative [&_a]:flex [&_a]:justify-center [&_a]:items-center [&_a]:gap-1 [&_a]:p-3 [&_a]:transition"
      >
        <div className="flex w-max h-full gap-4 px-3 whitespace-nowrap text-zinc-600">
          {publicLinks.map(({ href, label }) => (
            <MyPageNavigationLink href={href} key={href} label={label} />
          ))}
          <MyPagePrivateNavigation username={username} />
        </div>
      </nav>
      {children}
    </main>
  )
}
