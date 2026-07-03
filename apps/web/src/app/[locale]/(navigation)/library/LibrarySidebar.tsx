'use client'

import type { LibraryListItem } from '@litomi/contracts'

import { DEFAULT_LIBRARY_ICON } from '@litomi/domain/library/defaults'
import { formatNumber } from '@litomi/std'
import { Bookmark, Clock, LibraryBig, Lock, Pin, Star } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { type RefObject, useRef } from 'react'

import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'

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
  libraries: LibraryListItem[]
  pinnedLibraries?: LibraryListItem[]
  userId?: number
  className?: string
  onClick?: () => void
  summary?: {
    bookmarkCount?: number
    historyCount?: number
    ratingCount?: number
  }
  pagination?: PaginationProps
  scrollContainerRef?: RefObject<Element | null>
}

export default function LibrarySidebar({
  libraries,
  pinnedLibraries = [],
  userId,
  className = '',
  onClick,
  summary,
  pagination,
  scrollContainerRef,
}: Props) {
  const asideRef = useRef<HTMLElement>(null)
  const { bookmarkCount, historyCount, ratingCount } = summary ?? {}
  const ownerLibraries = userId ? libraries.filter((lib) => lib.userId === userId) : []
  const publicLibraries = userId ? libraries.filter((lib) => lib.userId !== userId) : libraries
  const publicMangaCount = publicLibraries.reduce((sum, lib) => sum + lib.itemCount, 0)
  const showLibrariesSkeleton = Boolean(pagination?.isPending) && libraries.length === 0
  const locale = useLocale()
  const t = useTranslations('Library')

  function libraryBadge(library: LibraryListItem) {
    if (!library.isPublic) {
      return <Lock className="size-3 text-zinc-500 shrink-0" />
    }

    if (library.pinCount === 0) {
      return null
    }

    return (
      <span className="flex items-center gap-0.5 text-xs text-zinc-500 shrink-0">
        <Pin aria-hidden className="size-3" />
        {formatNumber(library.pinCount, locale)}
      </span>
    )
  }

  const infiniteScrollTriggerRef = useInfiniteScrollObserver({
    hasNextPage: pagination?.hasNextPage && !pagination?.isFetchNextPageError,
    isFetchingNextPage: pagination?.isFetchingNextPage,
    fetchNextPage: pagination?.onRetryNextPage ?? noop,
    rootRef: scrollContainerRef ?? asideRef,
  })

  return (
    <aside className={`border-r ${className}`} ref={asideRef}>
      <div className="grid gap-2 p-2">
        <div className="flex items-center justify-center lg:justify-between">
          <h2 className="text-sm font-medium text-zinc-400 hidden lg:block">{t('sidebar.title')}</h2>
          <CreateLibraryButton />
        </div>
        <LibrarySidebarLink
          description={t('sidebar.publicWorkCount', { count: formatNumber(publicMangaCount, locale) })}
          href="/library"
          icon={<LibraryBig className="size-4 text-background" />}
          iconBackground="linear-gradient(to bottom right, var(--color-brand-start), var(--color-brand))"
          onClick={onClick}
          title={t('sidebar.publicLibraries')}
        />
        <LibrarySidebarSectionDivider label={t('sidebar.sections.activity')} />
        <LibrarySidebarLink
          description={
            historyCount !== undefined
              ? t('common.workCount', { count: formatNumber(historyCount, locale) })
              : t('sidebar.loading')
          }
          href="/library/history"
          icon={<Clock className="size-4 text-background" />}
          iconBackground="var(--color-brand)"
          onClick={onClick}
          title={t('sidebar.history')}
        />
        <LibrarySidebarLink
          description={
            bookmarkCount !== undefined
              ? t('common.workCount', { count: formatNumber(bookmarkCount, locale) })
              : t('sidebar.loading')
          }
          href="/library/bookmark"
          icon={<Bookmark className="size-4 text-background" />}
          iconBackground="var(--color-brand)"
          onClick={onClick}
          title={t('sidebar.bookmark')}
        />
        <LibrarySidebarLink
          description={
            ratingCount !== undefined
              ? t('common.workCount', { count: formatNumber(ratingCount, locale) })
              : t('sidebar.loading')
          }
          href="/library/rating"
          icon={<Star className="size-4 text-background" />}
          iconBackground="var(--color-brand)"
          onClick={onClick}
          title={t('sidebar.rating')}
        />
        {showLibrariesSkeleton ? (
          <>
            <LibrarySidebarSectionDivider />
            <LibrarySidebarSkeleton length={6} />
          </>
        ) : (
          <>
            {ownerLibraries.length > 0 && (
              <>
                <LibrarySidebarSectionDivider label={t('sidebar.sections.myLibraries')} />
                {ownerLibraries.map((library) => (
                  <LibrarySidebarLink
                    badge={libraryBadge(library)}
                    description={t('common.itemCount', { count: formatNumber(library.itemCount, locale) })}
                    href={`/library/${library.id}`}
                    icon={
                      <>
                        <span className="text-sm sm:hidden lg:inline">{library.icon || DEFAULT_LIBRARY_ICON}</span>
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
            {pinnedLibraries.length > 0 && (
              <>
                <LibrarySidebarSectionDivider label={t('sidebar.sections.pinned')} />
                {pinnedLibraries.map((library) => (
                  <LibrarySidebarLink
                    badge={libraryBadge(library)}
                    className={!library.isPublic ? 'opacity-50' : ''}
                    description={t('common.itemCount', { count: formatNumber(library.itemCount, locale) })}
                    href={`/library/${library.id}`}
                    icon={
                      <>
                        <span className="text-sm sm:hidden lg:inline">{library.icon || DEFAULT_LIBRARY_ICON}</span>
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
            {publicLibraries.length > 0 && (
              <>
                <LibrarySidebarSectionDivider label={t('sidebar.publicLibraries')} />
                {publicLibraries.map((library) => (
                  <LibrarySidebarLink
                    badge={libraryBadge(library)}
                    description={t('common.itemCount', { count: formatNumber(library.itemCount, locale) })}
                    href={`/library/${library.id}`}
                    icon={
                      <>
                        <span className="text-sm sm:hidden lg:inline">{library.icon || DEFAULT_LIBRARY_ICON}</span>
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
            {t('common.retry')}
          </button>
        )}
      </div>
    </aside>
  )
}

function LibrarySidebarSectionDivider({ label }: { label?: string }) {
  if (!label) {
    return (
      <div className="flex items-center px-2 py-1 sm:px-0 lg:px-3">
        <div className="h-px flex-1 bg-zinc-800" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 sm:px-0 lg:px-3">
      <div className="h-px flex-1 bg-zinc-800" />
      <span className="shrink-0 text-[11px] font-medium leading-none text-zinc-500 sm:hidden lg:inline">{label}</span>
      <div className="h-px flex-1 bg-zinc-800 sm:hidden lg:block" />
    </div>
  )
}

function LibrarySidebarSkeleton({ length = 6 }: { length?: number }) {
  return (
    <div className="grid gap-2 lg:gap-3">
      {Array.from({ length }).map((_, i) => (
        <div className="h-[50px] lg:h-[54px] rounded-lg bg-zinc-800/40 animate-pulse" key={i} />
      ))}
    </div>
  )
}

function noop() {}
