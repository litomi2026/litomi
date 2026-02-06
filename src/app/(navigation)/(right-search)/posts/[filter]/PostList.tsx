'use client'

import { Repeat } from 'lucide-react'
import Link from 'next/link'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useInView } from 'react-intersection-observer'

import { PostFilter } from '@/backend/api/v1/post/constant'
import CloudProviderStatus from '@/components/CloudProviderStatus'
import { type Post, PostSkeleton } from '@/components/post/PostCard'
import RetryGuidance from '@/components/RetryGuidance'
import Squircle from '@/components/ui/Squircle'
import usePostsInfiniteQuery from '@/query/usePostsQuery'

import PostMangaCard from '../../post/[id]/@post/PostMangaCard'

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
  const masonryColumnCount = useMasonryColumnCount()
  const masonryColumns = useMemo(
    () => splitIntoMasonryColumns(allPosts, masonryColumnCount),
    [allPosts, masonryColumnCount],
  )

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
    return (
      <div className="p-4">
        <PostListSkeleton />
      </div>
    )
  }

  if (isError) {
    return <ErrorState error={error} retry={() => refetch()} />
  }

  if (allPosts.length === 0) {
    return NotFound
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4" role="feed">
        {masonryColumns.map((columnPosts, columnIndex) => (
          <div className="flex flex-col gap-4" key={columnIndex}>
            {columnPosts.map((post) => (
              <MasonryPostCard key={post.id} post={post} />
            ))}
          </div>
        ))}
      </div>

      {hasNextPage && (
        <div
          aria-label={isFetchingNextPage ? '글을 가져오는 중' : '글을 더 가져오기'}
          className="py-4"
          ref={ref}
          role="status"
        >
          {isFetchingNextPage && <PostSkeleton />}
        </div>
      )}

      {!hasNextPage && allPosts.length > 0 && (
        <div className="py-8 text-center text-sm text-zinc-600">모든 글을 확인했어요</div>
      )}

      <div aria-hidden="true" className="h-20" />
    </div>
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

function MasonryPostCard({ post }: { post: Post }) {
  const author = post.author
  const authorNickname = author?.nickname

  return (
    <article className="w-full overflow-hidden rounded-2xl border-2 bg-zinc-900 transition hover:bg-zinc-800/70 hover:border-zinc-700/70">
      {post.mangaId && (
        <div className="border-b-2 border-zinc-800">
          <Link className="block" href={`/manga/${post.mangaId}`} prefetch={false}>
            <PostMangaCard mangaId={post.mangaId} variant="cover" />
          </Link>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <Link className="block p-3" href={`/post/${post.id}`} prefetch={false}>
          <p className="min-w-0 whitespace-pre-wrap break-all text-sm leading-relaxed line-clamp-4 text-zinc-100">
            {post.content || <span className="text-zinc-400">삭제된 글이에요</span>}
          </p>
        </Link>

        <Link
          className="flex min-w-0 items-center gap-2 text-xs text-zinc-400 p-3 pt-0"
          href={`/@${author?.name}`}
          prefetch={false}
        >
          <Squircle className="w-6 shrink-0" src={author?.imageURL} textClassName="text-[10px] text-foreground">
            {(authorNickname ?? '탈퇴').slice(0, 2)}
          </Squircle>
          <div className="min-w-0 flex-1 truncate" title={authorNickname}>
            {authorNickname ?? <span className="text-zinc-400">탈퇴한 사용자예요</span>}
          </div>
        </Link>
      </div>
    </article>
  )
}

function PostListSkeleton() {
  const masonryColumnCount = useMasonryColumnCount()
  const skeletonColumns = useMemo(
    () =>
      splitIntoMasonryColumns(
        [...Array(6)].map((_, i) => i),
        masonryColumnCount,
      ),
    [masonryColumnCount],
  )

  return (
    <div className="animate-fade-in grid grid-cols-1 gap-x-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {skeletonColumns.map((columnIndexes, columnIndex) => (
        <div className="flex flex-col gap-4" key={columnIndex}>
          {columnIndexes.map((i) => (
            <div className="aspect-5/7 w-full rounded-2xl border-2 bg-zinc-900" key={i} />
          ))}
        </div>
      ))}
    </div>
  )
}

function splitIntoMasonryColumns<T>(items: readonly T[], columnCount: number) {
  const safeColumnCount = Math.max(1, columnCount)
  const columns: T[][] = Array.from({ length: safeColumnCount }, () => [])

  items.forEach((item, index) => {
    columns[index % safeColumnCount]?.push(item)
  })

  return columns
}

function useMasonryColumnCount() {
  const [columnCount, setColumnCount] = useState(1)

  useEffect(() => {
    function compute() {
      const width = window.innerWidth
      if (width >= 1280) return 4 // xl
      if (width >= 768) return 3 // md
      if (width >= 640) return 2 // sm
      return 1
    }

    const update = () => setColumnCount(compute())

    update()
    window.addEventListener('resize', update, { passive: true })
    return () => window.removeEventListener('resize', update)
  }, [])

  return columnCount
}
