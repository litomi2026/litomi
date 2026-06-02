'use client'

import type { Post } from '@litomi/contracts'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'

import PostCard, { PostSkeleton } from './PostCard'

type Props = {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  loadNextPage: () => unknown
  posts: readonly Post[]
  showMangaCover: boolean
}

export default function MasonryPostList({
  hasNextPage,
  isFetchingNextPage,
  loadNextPage,
  posts,
  showMangaCover,
}: Props) {
  const masonryColumnCount = useMasonryColumnCount()
  const masonryColumns = splitIntoMasonryColumns(posts, masonryColumnCount, showMangaCover)
  const t = useTranslations('Community.posts')

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void loadNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, loadNextPage])

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
          {isFetchingNextPage && <span className="sr-only">{t('loading')}</span>}
        </output>
      )}

      {!hasNextPage && posts.length > 0 && (
        <div className="py-8 text-center text-sm text-zinc-600 sm:py-12">{t('endReached')}</div>
      )}
    </div>
  )
}

export function MasonryPostListSkeleton({ showMangaCover }: { showMangaCover: boolean }) {
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

function splitIntoMasonryColumns(posts: readonly Post[], columnCount: number, showMangaCover: boolean) {
  const columns: Post[][] = Array.from({ length: columnCount }, () => [])
  const columnWeights = Array.from({ length: columnCount }, () => 0)

  for (const post of posts) {
    const postWeight = showMangaCover && post.mangaId ? 3.3 : 1

    let targetColumn = 0
    for (let i = 1; i < columnCount; i++) {
      if (columnWeights[i]! < columnWeights[targetColumn]!) {
        targetColumn = i
      }
    }

    columns[targetColumn]!.push(post)
    columnWeights[targetColumn]! += postWeight
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
