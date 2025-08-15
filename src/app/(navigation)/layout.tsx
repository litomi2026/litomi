import Link from 'next/link'
import { Suspense } from 'react'

import type { LayoutProps } from '@/types/nextjs'

import BookmarkLink from '@/components/header/BookmarkLink'
import NotificationLink from '@/components/header/NotificationLink'
import ProfileLink from '@/components/header/ProfileLink'
import PublishButton from '@/components/header/PublishButton'
import IconHome from '@/components/icons/IconHome'
import IconLogo from '@/components/icons/IconLogo'
import IconPost from '@/components/icons/IconPost'
import IconSearch from '@/components/icons/IconSearch'
import SelectableLink from '@/components/SelectableLink'

import Profile, { ProfileSkeleton } from '../../components/header/Profile'

export default async function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-full mx-auto px-safe pb-safe max-w-screen-2xl sm:flex-row">
      <header
        className="fixed bottom-0 left-0 right-0 z-50 m-auto px-safe pb-safe grid grid-cols-[4fr_1fr] border-t-2 bg-background/70 backdrop-blur
          sm:inset-auto sm:flex sm:h-full sm:w-20 sm:flex-col sm:justify-between sm:gap-8 sm:border-r-2 sm:border-t-0 sm:p-2
          2xl:w-3xs"
      >
        <nav className="grid grid-cols-4 select-none whitespace-nowrap overflow-y-auto scrollbar-hidden sm:grid-cols-none sm:gap-2 xl:text-xl xl:leading-6">
          <Link className="p-2 w-fit mx-auto hidden sm:block 2xl:m-0" href="/">
            <IconLogo className="w-8" priority />
          </Link>
          <SelectableLink href="/mangas/1/hi/card" Icon={IconHome}>
            홈
          </SelectableLink>
          <SelectableLink href="/search" Icon={IconSearch}>
            검색
          </SelectableLink>
          <SelectableLink href="/posts/recommand" hrefMatch="/post" Icon={IconPost}>
            글
          </SelectableLink>
          <NotificationLink />
          <BookmarkLink className="hidden sm:block" />
          <ProfileLink className="hidden sm:block" />
          <PublishButton className="hidden mx-auto my-4 sm:block xl:mx-0" />
        </nav>
        <Suspense fallback={<ProfileSkeleton />}>
          <Profile />
        </Suspense>
      </header>
      <div className="hidden shrink-0 sm:block sm:w-20 2xl:w-3xs" />
      <div className="flex flex-col grow">
        {children}
        <p className="h-0 overflow-hidden tracking-widest invisible">
          litomi, manga, comic, webtoon, manhwa, manhua, cartoon, hitomi, illustration, episode, series, japan manga,
          web viewer, reader app, 리토미, 망가, 만화, 웹툰, 일러스트, 일러스트레이션, 에피소드, 단행본, 컬러웹툰, 카툰,
          짧은만화, 히토미, 일본만화, 만화 웹 뷰어
        </p>
      </div>
      <div className="w-full h-16 shrink-0 sm:hidden" />
    </div>
  )
}
