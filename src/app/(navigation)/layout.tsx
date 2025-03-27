import type { BaseLayoutProps } from '@/types/nextjs'

import IconLogo from '@/components/icons/IconLogo'
import ScrollButtons from '@/components/ScrollButtons'
import logoImage from '@/images/logo.webp'
import Image from 'next/image'
// import BellIcon from '@/svg/BellIcon'
// import BookmarkIcon from '@/svg/BookmarkIcon'
// import Dolphin from '@/svg/Dolphin'
// import HomeIcon from '@/svg/HomeIcon'
// import PostIcon from '@/svg/PostIcon'
// import SearchIcon from '@/svg/SearchIcon'
import Link from 'next/link'

// import NavigLink from './NavigLink'
// import ProfileLink from './ProfileLink'
// import PublishButton from './PublishButton'

export default async function Layout({ children }: BaseLayoutProps) {
  return (
    <div className="mx-auto px-safe pb-safe grid max-w-screen-2xl w-fit sm:flex">
      <header
        className="fixed bottom-0 z-50 px-safe pb-safe grid w-full grid-cols-[4fr_1fr] overflow-y-auto border-t-2 border-zinc-800 bg-background/70 backdrop-blur
          sm:inset-auto sm:flex sm:h-full sm:w-20 sm:flex-col sm:justify-between sm:gap-8 sm:border-r-2 sm:border-t-0 sm:p-2
          2xl:w-3xs"
      >
        <nav className="grid grid-cols-4 whitespace-nowrap sm:grid-cols-none sm:gap-2 xl:text-xl xl:leading-6">
          <Link className="p-2 w-fit mx-auto focus:outline-none" href="/mangas/id/desc/1">
            <IconLogo className="w-8" />
          </Link>
          {/* <NavigLink Icon={HomeIcon} href={`/${locale}/exam`}>
            {dict.홈[locale]}
          </NavigLink>
          <NavigLink Icon={SearchIcon} href={`/${locale}/search`}>
            {dict.검색[locale]}
          </NavigLink>
          <NavigLink Icon={PostIcon} href={`/${locale}/post`}>
            {dict.글[locale]}
          </NavigLink>
          <NavigLink Icon={BellIcon} href={`/${locale}/notification`}>
            {dict.알림[locale]}
          </NavigLink>
          <NavigLink Icon={BookmarkIcon} className="hidden sm:block" href={`/${locale}/bookmark`}>
            {dict.북마크[locale]}
          </NavigLink> */}
          {/* <PublishButton /> */}
        </nav>
        {/* <ProfileLink /> */}
      </header>
      <div className="w-0 shrink-0 sm:w-20 2xl:w-3xs" />
      {children}
      <div className="h-16 sm:hidden" />
      <ScrollButtons />
    </div>
  )
}
