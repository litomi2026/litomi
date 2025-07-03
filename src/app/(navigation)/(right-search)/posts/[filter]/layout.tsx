import { Suspense } from '@suspensive/react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import type { BaseLayoutProps } from '@/types/nextjs'

import PostCreationForm, { PostCreationFormSkeleton } from '@/components/post/PostCreationForm'
import TopNavigation from '@/components/TopNavigation'
import { validatePostFilter } from '@/utils/param'

export default async function Layout({ params, children }: BaseLayoutProps) {
  const { filter } = await params
  const postFilter = validatePostFilter(filter)

  if (!postFilter) {
    notFound()
  }

  const barClassName = 'absolute bottom-0 left-1/2 -translate-x-1/2 h-1 rounded w-14 aria-selected:bg-zinc-300'

  const isRecommand = filter === 'recommand'
  const isFollowing = filter === 'following'

  return (
    <div className="relative">
      <TopNavigation className="fixed sm:sticky top-0 left-0 right-0 z-10 border-b-2 sm:backdrop-blur bg-background sm:bg-background/75">
        <div
          className="grid grid-cols-2 items-center text-center text-zinc-400 [&_a]:p-4 [&_a]:transition [&_a]:relative [&_a]:aria-selected:font-bold [&_a]:aria-selected:text-foreground
           sm:[&_a]:bg-background/50 sm:[&_a]:hover:bg-foreground/10"
        >
          <Link aria-selected={isRecommand} href="recommand">
            추천
            <div aria-selected={isRecommand} className={barClassName} />
          </Link>
          <Link aria-selected={isFollowing} href="following">
            팔로우 중
            <div aria-selected={isFollowing} className={barClassName} />
          </Link>
        </div>
      </TopNavigation>
      <div className="h-26 sm:hidden" />
      <h2 className="text-center font-bold text-xl text-yellow-300 py-4">준비 중입니다</h2>
      <Suspense clientOnly fallback={<PostCreationFormSkeleton className="m-4" />}>
        <PostCreationForm
          buttonText="게시하기"
          className="hidden p-4 sm:flex"
          placeholder="무슨 일이 일어나고 있나요?"
        />
      </Suspense>
      {children}
    </div>
  )
}
