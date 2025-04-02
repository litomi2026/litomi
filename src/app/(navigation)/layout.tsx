import type { BaseLayoutProps } from '@/types/nextjs'

import BookmarkLink, { BookmarkLinkSkeleton } from '@/components/header/BookmarkLink'
import PublishButton from '@/components/header/PublishButton'
import IconBell from '@/components/icons/IconBell'
import IconHome from '@/components/icons/IconHome'
import IconLogo from '@/components/icons/IconLogo'
import IconPost from '@/components/icons/IconPost'
import IconSearch from '@/components/icons/IconSearch'
import SelectableLink from '@/components/SelectableLink'
import { createSentryExceptionReporter } from '@/utils/sentry'
import { ErrorBoundary, Suspense } from '@suspensive/react'
import Link from 'next/link'

import Profile, { ProfileError, ProfileSkeleton } from '../../components/header/Profile'

export default async function Layout({ children }: BaseLayoutProps) {
  return (
    <div className="mx-auto px-safe pb-safe grid max-w-screen-2xl w-fit sm:flex">
      <header
        className="fixed bottom-0 left-0 right-0 z-50 m-auto px-safe pb-safe grid grid-cols-[4fr_1fr] border-t-2 border-zinc-800 bg-background/70 backdrop-blur
          sm:inset-auto sm:flex sm:h-full sm:w-20 sm:flex-col sm:justify-between sm:gap-8 sm:border-r-2 sm:border-t-0 sm:p-2
          2xl:w-3xs"
      >
        <nav className="grid grid-cols-4 whitespace-nowrap overflow-y-auto scrollbar-hidden sm:grid-cols-none sm:gap-2 xl:text-xl xl:leading-6">
          <Link className="p-2 w-fit mx-auto hidden sm:block 2xl:m-0" href="/">
            <IconLogo className="w-8" priority />
          </Link>
          <SelectableLink href="/mangas/id/desc/1/hi" Icon={<IconHome />}>
            홈
          </SelectableLink>
          <SelectableLink href="/search" Icon={<IconSearch />}>
            검색
          </SelectableLink>
          <SelectableLink href="/posts" Icon={<IconPost />}>
            글
          </SelectableLink>
          <SelectableLink href="/notification" Icon={<IconBell />}>
            알림
          </SelectableLink>
          <Suspense clientOnly fallback={<BookmarkLinkSkeleton />}>
            <BookmarkLink />
          </Suspense>
          <PublishButton />
        </nav>
        <ErrorBoundary fallback={ProfileError} onError={createSentryExceptionReporter('Profile')}>
          <Suspense clientOnly fallback={<ProfileSkeleton />}>
            <Profile />
          </Suspense>
        </ErrorBoundary>
      </header>
      <div className="w-0 shrink-0 sm:w-20 2xl:w-3xs" />
      {children}
      <div className="h-16 sm:hidden" />
    </div>
  )
}
