'use client'

import { SquarePen } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useInView } from 'react-intersection-observer'

import { PostFilter } from '@/app/api/post/schema'
import CloudProviderStatus from '@/components/CloudProviderStatus'
import IconRepeat from '@/components/icons/IconRepeat'
import PostCard, { PostSkeleton } from '@/components/post/PostCard'
import RetryGuidance from '@/components/RetryGuidance'
import usePostsInfiniteQuery from '@/query/usePostsQuery'

type Props = {
  filter: PostFilter
  mangaId?: number
}

export default function PostList({ filter, mangaId }: Readonly<Props>) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error, refetch } =
    usePostsInfiniteQuery(filter, mangaId)

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

  if (isError && error) {
    return <ErrorState error={error} retry={() => refetch()} />
  }

  if (allPosts.length === 0) {
    return <EmptyState filter={filter} mangaId={mangaId} />
  }

  return (
    <ul role="feed">
      {allPosts.map((post, index) => (
        <li aria-posinset={index + 1} aria-setsize={-1} key={post.id} role="article">
          <PostCard className="border-t-2 border-zinc-800 hover:bg-zinc-900/50 transition-colors" post={post} />
        </li>
      ))}
      {hasNextPage && (
        <li
          aria-label={isFetchingNextPage ? '더 많은 포스트 로딩 중' : '더 많은 포스트 로드'}
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

function EmptyState({ filter, mangaId }: { filter: PostFilter; mangaId?: number }) {
  const emptyStateConfig = {
    [PostFilter.FOLLOWING]: {
      title: '팔로우한 사용자의 포스트가 없습니다',
      description: '다른 사용자를 팔로우하거나 모든 포스트를 확인해보세요',
      icon: '👥',
      action: { label: '모든 포스트 보기', href: '/posts/all' },
    },
    [PostFilter.RECOMMAND]: {
      title: '추천 포스트가 없습니다',
      description: '잠시 후 다시 확인해주세요',
      icon: '🎯',
      action: { label: '새로고침', href: '#' },
    },
    [PostFilter.MANGA]: {
      title: '이 작품에 대한 포스트가 없습니다',
      description: '첫 번째로 이 작품에 대해 이야기해보세요!',
      icon: '📚',
      action: { label: '포스트 작성', href: '#' },
    },
  }

  const config =
    mangaId && filter === PostFilter.RECOMMAND
      ? emptyStateConfig[PostFilter.MANGA]
      : (emptyStateConfig[filter] ?? {
          title: '아직 포스트가 없습니다',
          description: '첫 번째 포스트를 작성해보세요!',
          icon: '✨',
          action: { label: '포스트 작성', href: '#' },
        })

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div aria-label="empty state icon" className="text-4xl mb-4" role="img">
        {config.icon}
      </div>
      <h3 className="text-lg font-semibold text-zinc-200 mb-2">{config.title}</h3>
      <p className="text-sm text-zinc-500 mb-6 max-w-sm">{config.description}</p>

      {config.action &&
        (config.action.label === '새로고침' ? (
          <button
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            onClick={() => window.location.reload()}
          >
            <IconRepeat className="w-4 h-4" />
            <span>{config.action.label}</span>
          </button>
        ) : (
          <Link
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            href={config.action.href}
          >
            <SquarePen className="size-4" />
            <span>{config.action.label}</span>
          </Link>
        ))}

      {/* Alternative actions */}
      <div className="mt-8 flex items-center gap-2 text-xs text-zinc-600">
        <Link className="hover:text-zinc-400 transition-colors" href="/posts/all">
          모든 포스트
        </Link>
        <span>•</span>
        <Link className="hover:text-zinc-400 transition-colors" href="/search">
          검색하기
        </Link>
      </div>
    </div>
  )
}

function ErrorState({ error, retry }: { error: Error; retry: () => void }) {
  const [hasSystemIssues, setHasSystemIssues] = useState(false)

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div aria-label="error icon" className="text-3xl mb-4" role="img">
        😔
      </div>
      <h3 className="text-lg font-semibold text-zinc-200 mb-2">포스트를 불러올 수 없습니다</h3>

      <CloudProviderStatus onStatusUpdate={setHasSystemIssues} />
      <RetryGuidance errorMessage={error.message} hasSystemIssues={hasSystemIssues} />

      <button
        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors mt-4"
        onClick={retry}
      >
        <IconRepeat className="w-4 h-4" />
        <span>다시 시도</span>
      </button>

      <div className="mt-6 text-xs text-zinc-600">
        문제가 지속되면{' '}
        <Link className="underline hover:text-zinc-400" href="/posts/all">
          다른 포스트를 확인해보세요
        </Link>
      </div>
    </div>
  )
}

// Enhanced skeleton with more realistic content shapes
function PostListSkeleton() {
  return (
    <ul className="animate-fade-in">
      {[...Array(3)].map((_, i) => (
        <li className="border-t-2 border-zinc-800" key={i}>
          <div className="grid min-w-0 grid-cols-[auto_1fr] gap-2 px-4 pb-2 pt-3">
            {/* Avatar skeleton */}
            <div className="w-10 h-10 bg-zinc-800 rounded-xl animate-pulse" />

            <div className="grid gap-2">
              {/* Header skeleton */}
              <div className="flex items-center gap-2">
                <div className="w-24 h-4 bg-zinc-800 rounded animate-pulse" />
                <div className="w-32 h-3 bg-zinc-800/50 rounded animate-pulse" />
              </div>

              {/* Content skeleton */}
              <div className="space-y-1">
                <div className="w-full h-4 bg-zinc-800 rounded animate-pulse" />
                <div className="w-3/4 h-4 bg-zinc-800 rounded animate-pulse" />
              </div>

              {/* Actions skeleton */}
              <div className="flex gap-4 mt-2">
                {[...Array(4)].map((_, j) => (
                  <div className="w-12 h-6 bg-zinc-800/50 rounded animate-pulse" key={j} />
                ))}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
