'use client'

import type { Post } from '@litomi/contracts'

import { PostFilter } from '@litomi/domain/post/filter'
import { Frown, Repeat } from 'lucide-react'
import Link from 'next/link'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useInView } from 'react-intersection-observer'

import CloudProviderStatus from '@/components/CloudProviderStatus'
import RetryGuidance from '@/components/RetryGuidance'
import usePostInfiniteQuery from '@/query/usePostsQuery'
import { ProblemDetailsError } from '@/utils/react-query-error'

import FollowingUnauthorized from './FollowingUnauthorized'
import PostCard, { PostSkeleton } from './PostCard'

type Props = {
  filter: PostFilter
  mangaId?: number
  username?: string
  NotFound: ReactNode
  showMangaCover?: boolean
}

export default function MasonryPostList({ filter, mangaId, username, NotFound, showMangaCover }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error, refetch } =
    usePostInfiniteQuery(filter, mangaId, username)

  const allPosts = useMemo(() => data?.pages.flatMap((page) => page.posts) ?? [], [data])
  const masonryColumnCount = useMasonryColumnCount()

  const masonryColumns = useMemo(
    () => splitIntoMasonryColumns(allPosts, masonryColumnCount, (post) => estimatePostCardWeight(post, showMangaCover)),
    [allPosts, masonryColumnCount, showMangaCover],
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
      <div className="p-2 md:p-3">
        <div className="animate-fade-in grid grid-cols-1 gap-2 md:gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <PostSkeleton key={i} showMangaCover={showMangaCover} />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    if (filter === PostFilter.FOLLOWING && error instanceof ProblemDetailsError && error.status === 401) {
      return <FollowingUnauthorized />
    }

    return <ErrorState error={error} retry={() => refetch()} />
  }

  if (allPosts.length === 0) {
    return NotFound
  }

  return (
    <div className="flex-1 p-2 md:p-3">
      <div className="grid grid-cols-1 gap-x-2 sm:grid-cols-2 md:gap-x-3 md:grid-cols-3 xl:grid-cols-4" role="feed">
        {masonryColumns.map((columnPosts, columnIndex) => (
          <div className="flex flex-col gap-2 md:gap-3" key={columnIndex}>
            {columnPosts.map((post) => (
              <PostCard key={post.id} post={post} showMangaCover={showMangaCover} />
            ))}
            {isFetchingNextPage && <PostSkeleton showMangaCover={showMangaCover} />}
          </div>
        ))}
      </div>

      {hasNextPage && (
        <output className="block py-4" ref={ref}>
          {isFetchingNextPage && <span className="sr-only">글을 가져오는 중</span>}
        </output>
      )}

      {!hasNextPage && allPosts.length > 0 && (
        <div className="py-8 text-center text-sm text-zinc-600 sm:py-12">모든 글을 확인했어요</div>
      )}
    </div>
  )
}

function ErrorState({ error, retry }: { error: Error; retry: () => void }) {
  const [hasSystemIssues, setHasSystemIssues] = useState(false)

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8 p-4">
      <div aria-label="error icon" className="mb-4" role="img">
        <Frown aria-hidden className="size-10 text-zinc-500" />
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

function estimatePostCardWeight(post: Post, showMangaCover?: boolean) {
  if (!showMangaCover) {
    return 1
  }

  return post.mangaId ? 3.3 : 1
}

function splitIntoMasonryColumns<T>(items: readonly T[], columnCount: number, getItemWeight?: (item: T) => number) {
  const safeColumnCount = Math.max(1, columnCount)
  const columns: T[][] = Array.from({ length: safeColumnCount }, () => [])

  if (!getItemWeight) {
    items.forEach((item, index) => {
      columns[index % safeColumnCount]?.push(item)
    })

    return columns
  }

  const columnWeights = Array.from({ length: safeColumnCount }, () => 0)

  for (const item of items) {
    const itemWeight = Math.max(0, getItemWeight(item))

    let targetColumn = 0
    for (let i = 1; i < safeColumnCount; i++) {
      if (columnWeights[i]! < columnWeights[targetColumn]!) {
        targetColumn = i
      }
    }

    columns[targetColumn]!.push(item)
    columnWeights[targetColumn]! += itemWeight
  }

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
