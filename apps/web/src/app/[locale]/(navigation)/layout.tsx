import { Bookmark, Bot, Clover, FileText, Flame, LibraryBig, PiggyBank, Search, Tag } from 'lucide-react'
import { twMerge } from 'tailwind-merge'

import AutoHideHeader from '@/components/auto-hide/AutoHideHeader'
import IconBell from '@/components/icons/IconBell'
import IconHome from '@/components/icons/IconHome'
import IconLogo from '@/components/icons/LogoLitomi'
import SeasonalEffects from '@/components/seasonal/SeasonalEffects'
import { Link } from '@/i18n/navigation'

import { DEFAULT_METRIC, DEFAULT_PERIOD } from './(ranking)/common'
import NotificationCount from './NotificationCount'
import Profile from './Profile'
import ProfileLink from './ProfileLink'
import SelectableLink from './SelectableLink'

export default async function Layout({ children }: LayoutProps<'/[locale]'>) {
  return (
    <div className="flex flex-col min-h-full mx-auto px-safe max-w-screen-2xl sm:flex-row">
      <SeasonalEffects />
      <AutoHideHeader
        className={twMerge(
          'fixed bottom-0 left-0 right-0 z-50 m-auto px-safe pb-safe grid grid-cols-[4fr_1fr] border-t bg-background/80 backdrop-blur transition',
          'sm:inset-auto sm:flex sm:h-full sm:w-20 sm:flex-col sm:justify-between sm:gap-2 sm:border-r-2 sm:border-t-0 sm:px-0 sm:py-safe sm:data-[auto-hide=true]:opacity-100',
          '2xl:w-3xs',
        )}
      >
        <nav className="grid grid-cols-4 select-none whitespace-nowrap overflow-y-auto scrollbar-hidden sm:grid-cols-none sm:gap-2 xl:text-xl xl:leading-6 2xl:p-2">
          <Link className="p-3 w-fit mx-auto hidden sm:block 2xl:m-0" href="/" prefetch={false}>
            <IconLogo className="w-8" priority />
          </Link>
          <SelectableLink href="/new/1" icon={<IconHome />} selectedIconStyle="fill">
            홈
          </SelectableLink>
          <SelectableLink href="/search" icon={<Search />}>
            검색
          </SelectableLink>
          <SelectableLink
            className="hidden sm:block"
            href={`/ranking/${DEFAULT_METRIC}/${DEFAULT_PERIOD}`}
            icon={<Flame />}
            selectedIconStyle="fill"
          >
            인기
          </SelectableLink>
          <SelectableLink href="/library" icon={<LibraryBig />} selectedIconStyle="fill">
            서재
          </SelectableLink>
          <SelectableLink
            className="hidden sm:block"
            href="/library/bookmark"
            icon={<Bookmark />}
            selectedIconStyle="fill"
          >
            북마크
          </SelectableLink>
          <SelectableLink
            className="hidden sm:block"
            href="/posts/recommend"
            hrefMatch="/post"
            icon={<FileText />}
            selectedIconStyle="fill-soft"
          >
            이야기
          </SelectableLink>
          <SelectableLink className="hidden sm:block" href="/tag" icon={<Tag />} selectedIconStyle="fill-soft">
            태그
          </SelectableLink>
          <div className="relative">
            <SelectableLink className="h-full" href="/notification" icon={<IconBell />} selectedIconStyle="fill">
              알림
            </SelectableLink>
            <NotificationCount />
          </div>
          <SelectableLink
            className="hidden sm:block"
            href="/libo"
            hrefMatch="/libo"
            icon={<PiggyBank />}
            selectedIconStyle="fill-soft"
          >
            리보
          </SelectableLink>
          <SelectableLink className="hidden sm:block" href="/chat" icon={<Bot />} selectedIconStyle="stroke">
            AI 채팅
          </SelectableLink>
          <SelectableLink className="hidden sm:block" href="/fortune" hrefMatch="/fortune" icon={<Clover />}>
            운세
          </SelectableLink>
          <ProfileLink className="hidden sm:block" />
        </nav>
        <Profile />
      </AutoHideHeader>
      <div className="hidden shrink-0 sm:block sm:w-20 2xl:w-3xs" />
      {children}
    </div>
  )
}
