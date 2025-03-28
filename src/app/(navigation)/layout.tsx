import type { BaseLayoutProps } from '@/types/nextjs'

import BookmarkLink from '@/components/BookmarkLink'
import IconBell from '@/components/icons/IconBell'
import IconHome from '@/components/icons/IconHome'
import IconLogo from '@/components/icons/IconLogo'
import IconPost from '@/components/icons/IconPost'
import IconSearch from '@/components/icons/IconSearch'
import PublishButton from '@/components/PublishButton'
import SelectableLink from '@/components/SelectableLink'
import Link from 'next/link'
import { Suspense } from 'react'

import Profile from './Profile'

export default async function Layout({ children }: BaseLayoutProps) {
  return (
    <div className="mx-auto px-safe pb-safe grid max-w-screen-2xl w-fit sm:flex">
      <header
        className="fixed bottom-0 left-0 right-0 z-50 px-safe pb-safe grid grid-cols-[4fr_1fr] overflow-y-auto scrollbar-hidden border-t-2 border-zinc-800 bg-background/70 backdrop-blur
          sm:inset-auto sm:flex sm:h-full sm:w-20 sm:flex-col sm:justify-between sm:gap-8 sm:border-r-2 sm:border-t-0 sm:p-2
          2xl:w-3xs"
      >
        <nav className="grid grid-cols-4 whitespace-nowrap sm:grid-cols-none sm:gap-2 xl:text-xl xl:leading-6">
          <Link className="p-2 w-fit mx-auto hidden sm:block 2xl:m-0" href="/">
            <IconLogo className="w-8" priority />
          </Link>
          <SelectableLink href="/mangas/id/desc/1" Icon={IconHome}>
            홈
          </SelectableLink>
          <SelectableLink href="/search" Icon={IconSearch}>
            검색
          </SelectableLink>
          <SelectableLink href="/posts" Icon={IconPost}>
            글
          </SelectableLink>
          <SelectableLink href="/notification" Icon={IconBell}>
            알림
          </SelectableLink>
          <Suspense fallback={<div className="w-8 aspect-square bg-zinc-500 rounded-full" />}>
            <BookmarkLink />
          </Suspense>
          <Suspense fallback={<div className="w-8 aspect-square bg-zinc-500 rounded-full" />}>
            <PublishButton />
          </Suspense>
        </nav>
        <Suspense fallback={<div className="w-8 aspect-square bg-zinc-500 rounded-full" />}>
          <Profile />
        </Suspense>
      </header>
      <div className="w-0 shrink-0 sm:w-20 2xl:w-3xs" />
      {children}
      <div className="h-16 sm:hidden" />
    </div>
  )
}
