'use client'

import { Repeat } from 'lucide-react'
import Link from 'next/link'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useInView } from 'react-intersection-observer'

import { PostFilter } from '@/backend/api/v1/post/constant'
import CloudProviderStatus from '@/components/CloudProviderStatus'
import PostCard, { PostSkeleton } from '@/components/post/PostCard'
import RetryGuidance from '@/components/RetryGuidance'
import usePostsInfiniteQuery from '@/query/usePostsQuery'

type Props = {
  filter: PostFilter
  mangaId?: number
  username?: string
  NotFound: ReactNode
}

export default function PostList({ filter, mangaId, username, NotFound }: Readonly<Props>) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error, refetch } =
    usePostsInfiniteQuery(filter, mangaId, username)

  const allPosts = useMemo(() => data?.pages.flatMap((page) => page.posts) ?? [], [data])

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) {
    return <PostListSkeleton />
  }

  if (isError) {
    return <ErrorState error={error} retry={() => refetch()} />
  }

  if (allPosts.length === 0) {
    return NotFound
  }

  return (
    <ul className="[&_li]:not-first:border-t-2 [&_li]:hover:bg-zinc-900/50 [&_li]:transition" role="feed">
      {allPosts.map((post) => (
        <PostCard key={post.id} post={post} role="article" />
      ))}
      {hasNextPage && (
        <li
          aria-label={isFetchingNextPage ? '글을 가져오는 중' : '글을 더 가져오기'}
          className="py-4"
          ref={ref}
          role="status"
        >
          {isFetchingNextPage && <PostSkeleton />}
        </li>
      )}
      {!hasNextPage && allPosts.length > 0 && (
        <li className="py-8 text-center text-sm text-zinc-600">모든 글을 확인했어요</li>
      )}
      <div aria-hidden="true" className="h-20" />
    </ul>
  )
}

function ErrorState({ error, retry }: { error: Error; retry: () => void }) {
  const [hasSystemIssues, setHasSystemIssues] = useState(false)

  return (
    <div className="flex flex-col items-center justify-center py-8 p-4">
      <div aria-label="error icon" className="text-3xl mb-4" role="img">
        😔
      </div>
      <h3 className="text-lg font-semibold text-zinc-200 mb-2">글을 불러올 수 없어요</h3>

      <CloudProviderStatus onStatusUpdate={setHasSystemIssues} />
      <RetryGuidance errorMessage={error.message} hasSystemIssues={hasSystemIssues} />

      <button
        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition mt-4"
        onClick={retry}
      >
        <Repeat className="size-4" />
        <span>다시 시도</span>
      </button>

      <div className="mt-6 text-xs text-zinc-600">
        문제가 지속되면{' '}
        <Link className="underline hover:text-zinc-400" href="/posts/all" prefetch={false}>
          다른 글을 확인해보세요
        </Link>
      </div>
    </div>
  )
}

function PostListSkeleton() {
  return (
    <ul className="animate-fade-in [&_li]:not-first:border-t-2 [&_li]:border-zinc-800">
      {[...Array(2)].map((_, i) => (
        <li key={i}>
          <div className="grid min-w-0 grid-cols-[auto_1fr] gap-2 px-4 pb-2 pt-3">
            <div className="size-10 bg-zinc-800 rounded-xl" />
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <div className="w-24 h-4 bg-zinc-800 rounded" />
                <div className="w-32 h-3 bg-zinc-800/50 rounded" />
              </div>
              <div className="space-y-1">
                <div className="w-full h-4 bg-zinc-800 rounded" />
                <div className="w-3/4 h-4 bg-zinc-800 rounded" />
              </div>
              <div className="my-1 h-7 bg-zinc-800/50 rounded" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
