'use client'

import type { Post } from '@litomi/contracts'

import { Masonry, type RenderComponentProps, useInfiniteLoader } from 'masonic'
import { useTranslations } from 'next-intl'
import { useCallback, useLayoutEffect, useState } from 'react'

import PostCard, { PostSkeleton } from './PostCard'

type MasonryLayoutConfig = {
  columnCount: number
  gutter: number
}

type Props = {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  loadNextPage: () => unknown
  posts: Post[]
  showMangaCover: boolean
}

export default function MasonryPostList({
  hasNextPage,
  isFetchingNextPage,
  loadNextPage,
  posts,
  showMangaCover,
}: Props) {
  const layoutConfig = useMasonryLayoutConfig()
  const t = useTranslations('Community.posts')

  const loadMorePosts = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void loadNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, loadNextPage])

  const loadMoreOnRender = useInfiniteLoader(loadMorePosts, {
    isItemLoaded: (index) => index < posts.length,
    threshold: layoutConfig?.columnCount ?? 1,
    totalItems: hasNextPage ? posts.length + 1 : posts.length,
  })

  if (!layoutConfig) {
    return <MasonryPostSkeletonGrid count={6} showMangaCover={showMangaCover} />
  }

  return (
    <div className="flex-1 p-2 md:p-3">
      <Masonry
        columnCount={layoutConfig.columnCount}
        columnGutter={layoutConfig.gutter}
        itemHeightEstimate={showMangaCover ? 440 : 160}
        itemKey={getPostItemKey}
        items={posts}
        onRender={loadMoreOnRender}
        overscanBy={1.5}
        render={showMangaCover ? PostCardWithMangaCover : CompactPostCard}
        role="list"
        rowGutter={layoutConfig.gutter}
        tabIndex={-1}
      />

      {isFetchingNextPage && (
        <MasonryPostSkeletonGrid count={layoutConfig.columnCount} showMangaCover={showMangaCover} />
      )}

      {isFetchingNextPage && (
        <output className="sr-only">
          <span>{t('loading')}</span>
        </output>
      )}

      {!hasNextPage && posts.length > 0 && (
        <div className="py-8 text-center text-sm text-zinc-600 sm:py-12">{t('endReached')}</div>
      )}
    </div>
  )
}

export function MasonryPostSkeletonGrid({ count, showMangaCover }: { count: number; showMangaCover: boolean }) {
  return (
    <div className="animate-fade-in grid grid-cols-1 gap-2 md:gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <PostSkeleton key={i} showMangaCover={showMangaCover} />
      ))}
    </div>
  )
}

function CompactPostCard({ data }: RenderComponentProps<Post>) {
  if (!data) {
    return null
  }

  return <PostCard post={data} showMangaCover={false} />
}

// masonic는 리플로우 중 축소된 items 배열 밖 인덱스를 요청할 수 있어 data/post가 undefined일 수 있어요.
function getPostItemKey(post: Post | undefined, index: number) {
  return post?.id ?? index
}

function PostCardWithMangaCover({ data }: RenderComponentProps<Post>) {
  if (!data) {
    return null
  }

  return <PostCard post={data} showMangaCover />
}

function useMasonryLayoutConfig() {
  const [layoutConfig, setLayoutConfig] = useState<MasonryLayoutConfig | null>(null)

  useLayoutEffect(() => {
    const mediaQueries = [
      { columnCount: 4, gutter: 12, mediaQuery: window.matchMedia('(min-width: 1280px)') },
      { columnCount: 3, gutter: 12, mediaQuery: window.matchMedia('(min-width: 768px)') },
      { columnCount: 2, gutter: 8, mediaQuery: window.matchMedia('(min-width: 640px)') },
    ] as const

    function update() {
      setLayoutConfig(mediaQueries.find(({ mediaQuery }) => mediaQuery.matches) ?? { columnCount: 1, gutter: 8 })
    }

    update()

    for (const { mediaQuery } of mediaQueries) {
      mediaQuery.addEventListener('change', update)
    }

    return () => {
      for (const { mediaQuery } of mediaQueries) {
        mediaQuery.removeEventListener('change', update)
      }
    }
  }, [])

  return layoutConfig
}
