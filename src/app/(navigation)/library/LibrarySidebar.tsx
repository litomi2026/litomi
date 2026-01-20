'use client'

import { Bookmark, Clock, Globe, LibraryBig, Lock, Star } from 'lucide-react'
import { type RefObject, useRef } from 'react'

import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import { formatNumber } from '@/utils/format/number'
import { getLocaleFromCookie } from '@/utils/locale-from-cookie'

import CreateLibraryButton from './CreateLibraryButton'
import LibrarySidebarLink from './LibrarySidebarLink'

type PaginationProps = {
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  isFetchNextPageError?: boolean
  isPending?: boolean
  onRetryNextPage?: () => void
}

type Props = {
  libraries: {
    id: number
    name: string
    description: string | null
    color: string | null
    icon: string | null
    userId: number
    isPublic: boolean
    itemCount: number
  }[]
  userId: number | null
  className?: string
  onClick?: () => void
  bookmarkCount?: number
  historyCount?: number
  ratingCount?: number
  pagination?: PaginationProps
  scrollContainerRef?: RefObject<Element | null>
}

export default function LibrarySidebar({
  libraries,
  userId,
  className = '',
  onClick,
  bookmarkCount,
  historyCount,
  ratingCount,
  pagination,
  scrollContainerRef,
}: Props) {
  const asideRef = useRef<HTMLElement>(null)
  const ownerLibraries = userId ? libraries.filter((lib) => lib.userId === userId) : []
  const publicLibraries = userId ? libraries.filter((lib) => lib.userId !== userId) : libraries
  const publicMangaCount = publicLibraries.reduce((sum, lib) => sum + lib.itemCount, 0)
  const showLibrariesSkeleton = Boolean(pagination?.isPending) && libraries.length === 0
  const locale = getLocaleFromCookie() || 'ko'

  const infiniteScrollTriggerRef = useInfiniteScrollObserver({
    hasNextPage: pagination?.hasNextPage && !pagination?.isFetchNextPageError,
    isFetchingNextPage: pagination?.isFetchingNextPage,
    fetchNextPage: pagination?.onRetryNextPage ?? noop,
    rootRef: scrollContainerRef ?? asideRef,
  })

  return (
    <aside className={`border-r ${className}`} ref={asideRef}>
      <div className="grid gap-2 p-2 lg:p-3 lg:gap-3">
        <div className="flex items-center justify-center lg:justify-between">
          <h2 className="text-sm font-medium text-zinc-400 hidden lg:block">서재</h2>
          <CreateLibraryButton />
        </div>
        <LibrarySidebarLink
          description={`작품 ${formatNumber(publicMangaCount, locale)}개`}
          href="/library"
          icon={<LibraryBig className="size-4 text-background" />}
          iconBackground="linear-gradient(to bottom right, var(--color-brand-start), var(--color-brand))"
          onClick={onClick}
          title="공개 서재"
        />
        <div className="h-px bg-zinc-800 my-1" />
        <LibrarySidebarLink
          description={historyCount !== undefined ? `${formatNumber(historyCount, locale)}개 작품` : '...'}
          href="/library/history"
          icon={<Clock className="size-4 text-background" />}
          iconBackground="var(--color-brand)"
          onClick={onClick}
          title="감상 기록"
        />
        <LibrarySidebarLink
          description={bookmarkCount !== undefined ? `${formatNumber(bookmarkCount, locale)}개 작품` : '...'}
          href="/library/bookmark"
          icon={<Bookmark className="size-4 text-background" />}
          iconBackground="var(--color-brand)"
          onClick={onClick}
          title="북마크"
        />
        <LibrarySidebarLink
          description={ratingCount !== undefined ? `${formatNumber(ratingCount, locale)}개 작품` : '...'}
          href="/library/rating"
          icon={<Star className="size-4 text-background" />}
          iconBackground="var(--color-brand)"
          onClick={onClick}
          title="평가"
        />
        {(libraries.length > 0 || showLibrariesSkeleton) && <div className="h-px bg-zinc-800 my-1" />}
        {showLibrariesSkeleton ? (
          <div className="grid gap-2 px-1">
            <LibrarySidebarSkeleton length={6} />
          </div>
        ) : (
          <>
            {ownerLibraries.map((library) => (
              <LibrarySidebarLink
                badge={
                  !library.isPublic ? (
                    <Lock className="size-3 text-zinc-500 shrink-0" />
                  ) : library.userId !== userId ? (
                    <Globe className="size-3 text-zinc-500 shrink-0" />
                  ) : null
                }
                description={`${formatNumber(library.itemCount)}개`}
                href={`/library/${library.id}`}
                icon={
                  <>
                    <span className="text-sm sm:hidden lg:inline">{library.icon || '📚'}</span>
                    <span className="text-sm hidden sm:inline lg:hidden text-foreground font-semibold">
                      {library.name.slice(0, 1)}
                    </span>
                  </>
                }
                iconBackground={library.color || 'rgb(113 113 122)'}
                key={library.id}
                onClick={onClick}
                showActiveIndicator
                title={library.name}
              />
            ))}
            {ownerLibraries.length > 0 && publicLibraries.length > 0 && <div className="h-px bg-zinc-800 my-1" />}
            {publicLibraries.map((library) => (
              <LibrarySidebarLink
                badge={
                  !library.isPublic ? (
                    <Lock className="size-3 text-zinc-500 shrink-0" />
                  ) : library.userId !== userId ? (
                    <Globe className="size-3 text-zinc-500 shrink-0" />
                  ) : null
                }
                description={`${formatNumber(library.itemCount)}개`}
                href={`/library/${library.id}`}
                icon={
                  <>
                    <span className="text-sm sm:hidden lg:inline">{library.icon || '📚'}</span>
                    <span className="text-sm hidden sm:inline lg:hidden text-foreground font-semibold">
                      {library.name.slice(0, 1)}
                    </span>
                  </>
                }
                iconBackground={library.color || 'rgb(113 113 122)'}
                key={library.id}
                onClick={onClick}
                showActiveIndicator
                title={library.name}
              />
            ))}
          </>
        )}
        {pagination?.isFetchingNextPage && (
          <div className="text-xs text-zinc-500">
            <LibrarySidebarSkeleton length={2} />
          </div>
        )}
        {pagination?.hasNextPage && <div className="w-full p-2" ref={infiniteScrollTriggerRef} />}
        {pagination?.isFetchNextPageError && pagination.onRetryNextPage && (
          <button
            className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:text-foreground hover:bg-zinc-800/50 rounded-lg transition"
            onClick={pagination.onRetryNextPage}
            type="button"
          >
            다시 시도해요
          </button>
        )}
      </div>
    </aside>
  )
}

function LibrarySidebarSkeleton({ length = 6 }: { length?: number }) {
  return (
    <div className="grid gap-2 px-1">
      {Array.from({ length }).map((_, i) => (
        <div className="h-12 rounded-lg bg-zinc-800/40 animate-pulse" key={i} />
      ))}
    </div>
  )
}

function noop() {}
