import type { BaseLayoutProps } from '@/types/nextjs'

import IconBell from '@/components/icons/IconBell'
import IconBookmark from '@/components/icons/IconBookmark'
import IconHome from '@/components/icons/IconHome'
import IconLogo from '@/components/icons/IconLogo'
import IconPost from '@/components/icons/IconPost'
import IconSearch from '@/components/icons/IconSearch'
import SelectableLink from '@/components/SelectableLink'
// import BellIcon from '@/svg/BellIcon'
// import BookmarkIcon from '@/svg/BookmarkIcon'
// import HomeIcon from '@/svg/HomeIcon'
// import PostIcon from '@/svg/PostIcon'
// import SearchIcon from '@/svg/SearchIcon'
import Link from 'next/link'

// import SelectableLink from './SelectableLink'
// import ProfileLink from './ProfileLink'
// import PublishButton from './PublishButton'

export default async function Layout({ children }: BaseLayoutProps) {
  return (
    <div className="mx-auto px-safe pb-safe grid max-w-screen-2xl w-fit sm:flex">
      <header
        className="fixed bottom-0 z-50 px-safe pb-safe grid w-full grid-cols-[4fr_1fr] overflow-y-auto border-t-2 border-zinc-700 bg-background/70 backdrop-blur
          sm:inset-auto sm:flex sm:h-full sm:w-20 sm:flex-col sm:justify-between sm:gap-8 sm:border-r-2 sm:border-t-0 sm:p-2
          2xl:w-3xs"
      >
        <nav className="grid grid-cols-4 whitespace-nowrap sm:grid-cols-none sm:gap-2 xl:text-xl xl:leading-6">
          <Link className="p-2 w-fit mx-auto focus:outline-none hidden sm:block" href="/mangas/id/desc/1">
            <IconLogo className="w-8" />
          </Link>
          <SelectableLink href="/mangas/id/desc/1" Icon={IconHome}>
            홈
          </SelectableLink>
          <SelectableLink href="/search" Icon={IconSearch}>
            검색
          </SelectableLink>
          <SelectableLink href="/post" Icon={IconPost}>
            글
          </SelectableLink>
          <SelectableLink href="/notification" Icon={IconBell}>
            알림
          </SelectableLink>
          <SelectableLink className="hidden sm:block" href="/bookmark" Icon={IconBookmark}>
            북마크
          </SelectableLink>
          {/* <PublishButton /> */}
        </nav>
        {/* <ProfileLink /> */}
      </header>
      <div className="w-0 shrink-0 sm:w-20 2xl:w-3xs" />
      {children}
      <div className="h-16 sm:hidden" />
    </div>
  )
}
