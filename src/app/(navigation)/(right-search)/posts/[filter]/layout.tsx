import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PostFilter } from '@/backend/api/v1/post/constant'
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
  const isRecommand = filter === PostFilterParams.RECOMMAND
  const isFollowing = filter === PostFilterParams.FOLLOWING
  const barClassName = 'absolute bottom-0 left-1/2 -translate-x-1/2 h-1 rounded w-14 aria-selected:bg-zinc-300'

  return (
    <div className="relative">
      <NavigationWithMobileMenu className="fixed sm:sticky top-0 left-0 right-0 z-10 border-b-2 sm:backdrop-blur bg-background sm:bg-background/75">
        <div
          className="grid grid-cols-2 items-center text-center text-zinc-400 [&_a]:p-4 [&_a]:transition [&_a]:relative [&_a]:aria-selected:font-bold [&_a]:aria-selected:text-foreground
           sm:[&_a]:bg-background/50 sm:[&_a]:hover:bg-foreground/10"
        >
          <Link aria-selected={isRecommand} href="recommand" prefetch={false}>
            추천
            <div aria-selected={isRecommand} className={barClassName} />
          </Link>
          <Link aria-selected={isFollowing} href="following" prefetch={false}>
            팔로우 중
            <div aria-selected={isFollowing} className={barClassName} />
          </Link>
        </div>
      </NavigationWithMobileMenu>
      <div className="h-26 sm:hidden" />
      <h2 className="sr-only">게시글 목록</h2>
      <PostCreationForm
        buttonText="게시하기"
        className="flex p-4 border-b-2"
        filter={filter === PostFilterParams.RECOMMAND ? PostFilter.RECOMMAND : PostFilter.FOLLOWING}
        placeholder="무슨 일이 일어나고 있나요?"
      />
      {children}
    </div>
  )
}
