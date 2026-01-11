import { Bookmark, FileText, Flame, LibraryBig, PiggyBank, Search, Tag } from 'lucide-react'
import Link from 'next/link'

import IconBell from '@/components/icons/IconBell'
import IconHome from '@/components/icons/IconHome'
import IconLogo from '@/components/icons/LogoLitomi'
import SEOText from '@/components/SEOText'

import { DEFAULT_METRIC, DEFAULT_PERIOD } from './(ranking)/common'
import AutoHideNavigation from './AutoHideNavigation'
import NotificationCount from './NotificationCount'
import Profile from './Profile'
import ProfileLink from './ProfileLink'
import PublishButton from './PublishButton'
import SelectableLink from './SelectableLink'

export default async function Layout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex flex-col min-h-full mx-auto p-safe max-w-screen-2xl sm:flex-row">
      <header
        className="fixed bottom-0 left-0 right-0 z-50 m-auto px-safe pb-safe grid grid-cols-[4fr_1fr] border-t-2 bg-background/80 backdrop-blur transition
          sm:inset-auto sm:flex sm:h-full sm:w-20 sm:flex-col sm:justify-between sm:gap-8 sm:border-r-2 sm:border-t-0 sm:p-2 2xl:w-3xs
          aria-busy:max-sm:opacity-50"
        data-navigation-header
      >
        <AutoHideNavigation selector="[data-navigation-header]" />
        <nav className="grid grid-cols-4 select-none whitespace-nowrap overflow-y-auto scrollbar-hidden sm:grid-cols-none sm:gap-2 xl:text-xl xl:leading-6">
          <Link className="p-2 w-fit mx-auto hidden sm:block 2xl:m-0" href="/" prefetch={false}>
            <IconLogo className="w-8" priority />
          </Link>
          <SelectableLink href="/new/1" icon={<IconHome />} selectedIconStyle="fill">
            홈
          </SelectableLink>
          <SelectableLink href="/search" icon={<Search />}>
            검색
          </SelectableLink>
          <SelectableLink href="/library" icon={<LibraryBig />} selectedIconStyle="fill">
            서재
          </SelectableLink>
          <SelectableLink
            className="hidden sm:block"
            href={`/ranking/${DEFAULT_METRIC}/${DEFAULT_PERIOD}`}
            icon={<Flame />}
            selectedIconStyle="fill"
          >
            인기
          </SelectableLink>
          <div className="relative">
            <SelectableLink href="/notification" icon={<IconBell />} selectedIconStyle="fill">
              알림
            </SelectableLink>
            <NotificationCount />
          </div>
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
            href="/posts/recommand"
            hrefMatch="/post"
            icon={<FileText />}
            selectedIconStyle="fill-soft"
          >
            이야기
          </SelectableLink>
          <SelectableLink className="hidden sm:block" href="/tag" icon={<Tag />} selectedIconStyle="fill-soft">
            태그
          </SelectableLink>
          <SelectableLink
            className="hidden sm:block"
            href="/libo"
            hrefMatch="/libo"
            icon={<PiggyBank />}
            selectedIconStyle="fill-soft"
          >
            리보
          </SelectableLink>
          <ProfileLink className="hidden sm:block" />
          <PublishButton className="hidden mx-auto my-4 sm:block xl:mx-0" />
        </nav>
        <Profile />
      </header>
      <div className="hidden shrink-0 sm:block sm:w-20 2xl:w-3xs" />
      <div className="flex flex-col grow min-w-0">
        {children}
        <p className="h-0 overflow-hidden tracking-widest invisible">
          <SEOText />
        </p>
      </div>
      <div className="w-full h-16 shrink-0 sm:hidden" />
    </div>
  )
}
