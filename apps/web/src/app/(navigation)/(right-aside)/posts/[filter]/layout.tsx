import Link from 'next/link'
import { notFound } from 'next/navigation'
import { twMerge } from 'tailwind-merge'

import PostCreationForm from '@/components/post/PostCreationForm'

import NavigationWithMobileMenu from './NavigationWithMobileMenu'
import { PostFilterParams, postFilterSchema } from './schema'

export const dynamic = 'error'

export default async function Layout({ params, children }: LayoutProps<'/posts/[filter]'>) {
  const validation = postFilterSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { filter } = validation.data
  const isrecommend = filter === PostFilterParams.RECOMMEND
  const isFollowing = filter === PostFilterParams.FOLLOWING
  const barClassName = 'absolute bottom-0 left-1/2 -translate-x-1/2 h-1 rounded w-14 aria-selected:bg-zinc-300'

  return (
    <>
      <NavigationWithMobileMenu
        className={twMerge(
          'fixed top-0 left-0 right-0 z-10 border-b backdrop-blur bg-background/90',
          'sm:sticky sm:pt-safe sm:min-h-(--safe-area-top)',
        )}
      >
        <div
          className={twMerge(
            'grid grid-cols-2 items-center text-center text-zinc-400 [&_a]:p-4 [&_a]:transition [&_a]:relative [&_a]:aria-selected:font-bold [&_a]:aria-selected:text-foreground',
            'sm:[&_a]:hover:bg-foreground/10',
          )}
        >
          <Link aria-selected={isrecommend} href="recommend" prefetch={false}>
            추천
            <div aria-selected={isrecommend} className={barClassName} />
          </Link>
          <Link aria-selected={isFollowing} href="following" prefetch={false}>
            팔로우 중
            <div aria-selected={isFollowing} className={barClassName} />
          </Link>
        </div>
      </NavigationWithMobileMenu>
      <div className="h-[calc(6.5rem+var(--safe-area-top))] sm:hidden" />
      <h2 className="sr-only">이야기 목록</h2>
      <PostCreationForm className="flex p-4 border-b" placeholder="무슨 일이 일어나고 있나요?" />
      {children}
    </>
  )
}
