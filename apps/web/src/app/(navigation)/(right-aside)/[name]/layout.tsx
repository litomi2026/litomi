import { getUsernameFromParam } from '@litomi/std'
import { twMerge } from 'tailwind-merge'

import { TopStickySafeAreaSurface } from '@/components/SafeAreaSurface'

import MyPageNavigationLink from './MyPageNavigationLink'
import MyPagePrivateNavigation from './MyPagePrivateNavigation'
import UserProfile from './UserProfile'

export default async function Layout({ params, children }: LayoutProps<'/[name]'>) {
  const { name } = await params
  const username = getUsernameFromParam(name)
  const publicLinks = [{ href: `/@${username}`, label: '이야기' }]

  return (
    <main className="flex flex-col grow">
      <UserProfile username={username} />
      <TopStickySafeAreaSurface />
      <nav
        className={twMerge(
          'sticky top-(--safe-area-top) min-h-(--safe-area-top) z-30 overflow-x-auto scrollbar-hidden border-b bg-background font-semibold',
          '[&_a]:min-w-16 [&_a]:group [&_a]:relative [&_a]:flex [&_a]:justify-center [&_a]:items-center [&_a]:gap-1 [&_a]:p-3 [&_a]:transition',
        )}
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
