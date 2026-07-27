'use client'

import type { LibraryListItem } from '@litomi/contracts'

import { Dialog } from '@litomi/ui'
import { Edit, Menu, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import LibraryItemImportButton from '@/app/[locale]/(navigation)/library/LibraryItemImportButton'
import AutoHideHeader from '@/components/auto-hide/AutoHideHeader'
import { usePathname } from '@/i18n/navigation'
import ShareLibraryButton from './[id]/ShareLibraryButton'
import BookmarkImportButton from './bookmark/BookmarkImportButton'
import useBulkDeleteBookmarkAction from './bookmark/useBulkDeleteBookmarkAction'
import type { BulkActionDescriptor, BulkTargetLibrary } from './bulkActionTypes'
import { getBulkOperationPermissions } from './bulkOperationPermissions'
import type { ReadingHistorySource } from './history/common'
import HistoryClearAllButton from './history/HistoryClearAllButton'
import useBulkDeleteReadingHistoryAction from './history/useBulkDeleteReadingHistoryAction'
import LibraryManagementMenu from './LibraryManagementMenu'
import LibrarySidebar from './LibrarySidebar'
import { useLibrarySelection } from './librarySelection'
import PinLibraryButton from './PinLibraryButton'
import useBulkDeleteRatingAction from './rating/useBulkDeleteRatingAction'
import useBulkCopyToLibraryAction from './useBulkCopyToLibraryAction'
import useBulkMoveToLibraryAction from './useBulkMoveToLibraryAction'
import useBulkRemoveFromLibraryAction from './useBulkRemoveFromLibraryAction'
import useCurrentLibraryMeta from './useCurrentLibraryMeta'

const BulkOperationsToolbar = dynamic(() => import('./BulkOperationsToolbar'))

type LibraryPageKind = 'bookmark' | 'browse' | 'detail' | 'history' | 'rating'

type Props = {
  libraries: LibraryListItem[]
  pinnedLibraries?: LibraryListItem[]
  userId?: number
  historySource?: ReadingHistorySource
  summary?: {
    bookmarkCount?: number
    historyCount?: number
    ratingCount?: number
  }
  sidebarPagination?: SidebarPagination
}

type SidebarPagination = {
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  isFetchNextPageError?: boolean
  isPending?: boolean
  onRetryNextPage?: () => void
}

export default function LibraryHeader({
  libraries,
  pinnedLibraries = [],
  userId,
  historySource = 'server',
  summary,
  sidebarPagination,
}: Props) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const drawerScrollContainerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const t = useTranslations('Library')
  const pageKind = getLibraryPageKind(pathname)
  const deleteRatingsAction = useBulkDeleteRatingAction()
  const deleteBookmarksAction = useBulkDeleteBookmarkAction()
  const { isSelectionMode, enter, exit } = useLibrarySelection()
  const currentLibrary = useCurrentLibraryMeta({ enabled: pageKind === 'detail', userId })
  const deleteReadingHistoryAction = useBulkDeleteReadingHistoryAction({ source: historySource, userId })

  const permissions =
    pageKind === 'history' && historySource === 'local' && !userId
      ? {
          canSelectItems: true,
          canCopy: false,
          canMove: false,
          canDelete: true,
        }
      : getBulkOperationPermissions(pageKind, currentLibrary, userId)

  const { bookmarkCount, historyCount, ratingCount } = summary ?? {}
  const isOwner = currentLibrary?.userId === userId
  const isPublicLibrary = currentLibrary?.isPublic
  const currentLibraryId = currentLibrary?.id

  const headerTitle = {
    bookmark: t('header.pageTitle.bookmark'),
    browse: t('header.pageTitle.browse'),
    detail: currentLibrary?.name ?? t('header.pageTitle.detailFallback'),
    history: t('header.pageTitle.history'),
    rating: t('header.pageTitle.rating'),
  }[pageKind]

  const drawerTitle = pageKind === 'browse' ? t('header.browseDrawerTitle') : t('header.drawerTitle')

  const ownedLibraries = libraries
    .filter((library) => library.userId === userId && library.id !== currentLibraryId)
    .map(
      (library): BulkTargetLibrary => ({
        color: library.color,
        icon: library.icon,
        id: library.id,
        itemCount: library.itemCount,
        name: library.name,
      }),
    )

  const copyAction = useBulkCopyToLibraryAction({ libraries: ownedLibraries })
  const moveAction = useBulkMoveToLibraryAction({ currentLibraryId, libraries: ownedLibraries })
  const removeFromLibraryAction = useBulkRemoveFromLibraryAction({ libraryId: currentLibraryId })
  const collectionDeleteAction = getCollectionDeleteAction()
  const bulkActions = getBulkActions()
  const selectionItemCount = getSelectionItemCount()
  const isEmpty = selectionItemCount === 0

  function openDrawer() {
    setIsDrawerOpen(true)
  }

  function closeDrawer() {
    setIsDrawerOpen(false)
  }

  function handleSelectionModeChange() {
    if (isSelectionMode) {
      exit()
    } else {
      enter()
    }
  }

  function getCollectionDeleteAction() {
    if (pageKind === 'bookmark') {
      return deleteBookmarksAction
    }

    if (pageKind === 'history') {
      return deleteReadingHistoryAction
    }

    if (pageKind === 'rating') {
      return deleteRatingsAction
    }

    return null
  }

  function getBulkActions() {
    const actions: BulkActionDescriptor[] = []

    if (pageKind === 'detail') {
      if (!isOwner) {
        if (permissions.canCopy) {
          actions.push(copyAction)
        }

        return actions
      }

      if (permissions.canMove) {
        actions.push(moveAction)
      }
      if (permissions.canCopy) {
        actions.push(copyAction)
      }
      if (permissions.canDelete) {
        actions.push(removeFromLibraryAction)
      }

      return actions
    }

    if (permissions.canCopy) {
      actions.push(copyAction)
    }
    if (permissions.canDelete && collectionDeleteAction) {
      actions.push(collectionDeleteAction)
    }

    return actions
  }

  function getSelectionItemCount() {
    if (pageKind === 'bookmark') {
      return bookmarkCount
    }

    if (pageKind === 'history') {
      return historyCount
    }

    if (pageKind === 'rating') {
      return ratingCount
    }

    return currentLibrary?.itemCount
  }

  // NOTE: 사이드바가 상시 노출되는 폭이 되면 드로어는 중복이라 닫아요
  useEffect(() => {
    if (!isDrawerOpen) {
      return
    }

    const query = window.matchMedia('(min-width: 40rem)')

    function closeWhenSidebarVisible(event: MediaQueryListEvent) {
      if (event.matches) {
        setIsDrawerOpen(false)
      }
    }

    if (query.matches) {
      setIsDrawerOpen(false)
    }

    query.addEventListener('change', closeWhenSidebarVisible)

    return () => query.removeEventListener('change', closeWhenSidebarVisible)
  }, [isDrawerOpen])

  return (
    <>
      <AutoHideHeader
        className={twMerge(
          'fixed top-0 left-0 right-0 z-40 border-b border-zinc-800 bg-background transition px-safe pt-safe',
          'sm:left-36.75 sm:pl-0',
          'lg:left-72',
          '2xl:left-[calc((100vw-1536px)/2+29rem)] 2xl:right-[calc((100vw-1536px)/2)]',
        )}
      >
        <div className="flex min-h-(--library-header-height) items-center justify-between gap-3 p-2.5 sm:p-3">
          <div className="flex items-center gap-3">
            <button
              aria-expanded={isDrawerOpen}
              aria-haspopup="dialog"
              aria-label={t('header.menu')}
              className="p-3 -mx-2 hover:bg-zinc-800 rounded-lg transition aria-expanded:bg-zinc-800 sm:hidden"
              onClick={openDrawer}
              type="button"
            >
              <Menu className="size-5" />
            </button>
            {!isSelectionMode && currentLibrary && (
              <div
                className="hidden size-10 rounded-lg sm:flex items-center bg-zinc-800 justify-center text-xl shrink-0"
                style={{ backgroundColor: currentLibrary.color ?? '' }}
              >
                {currentLibrary.icon ?? currentLibrary.name[0]}
              </div>
            )}
            {!isSelectionMode && (
              <div className="grid flex-1 break-all">
                <h1 className="text-base font-medium line-clamp-1 sm:text-lg sm:font-bold" title={headerTitle}>
                  {headerTitle}
                </h1>
                {currentLibrary?.description && (
                  <p className="max-sm:hidden text-xs text-zinc-400 line-clamp-1">{currentLibrary.description}</p>
                )}
              </div>
            )}
          </div>
          {isSelectionMode && <BulkOperationsToolbar actions={bulkActions} />}
          <div className="flex items-center">
            {!isSelectionMode && pageKind === 'history' && (userId || historySource === 'local') && (
              <HistoryClearAllButton historyCount={historyCount} source={historySource} />
            )}
            {!isSelectionMode && pageKind === 'bookmark' && Boolean(userId) && <BookmarkImportButton variant="icon" />}
            {!isSelectionMode && isPublicLibrary && currentLibrary && (
              <>
                <PinLibraryButton className="p-3" library={currentLibrary} libraryId={currentLibrary.id} />
                <ShareLibraryButton className="p-3" library={currentLibrary} />
              </>
            )}
            {!isSelectionMode && isOwner && currentLibrary && <LibraryItemImportButton libraryId={currentLibrary.id} />}
            {permissions.canSelectItems && (
              <button
                className="p-3 hover:bg-zinc-800 rounded-lg transition disabled:opacity-50"
                disabled={isEmpty}
                onClick={handleSelectionModeChange}
                title={isEmpty ? t('header.emptySelectionTitle') : t('header.selectionToggleTitle')}
                type="button"
              >
                {isSelectionMode ? <X className="size-5" /> : <Edit className="size-5" />}
              </button>
            )}
            {!isSelectionMode && isOwner && currentLibrary && (
              <LibraryManagementMenu className="-mr-1 p-3" library={currentLibrary} />
            )}
          </div>
        </div>
      </AutoHideHeader>
      <Dialog
        ariaLabel={drawerTitle}
        className={twMerge(
          'w-3xs max-w-[85vw] mr-auto scale-100 -translate-x-full rounded-none border-r border-zinc-800 bg-background',
          'data-[state=open]:translate-x-0',
        )}
        onClose={closeDrawer}
        open={isDrawerOpen}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-800 p-4">
          <h2 className="text-lg font-medium">{drawerTitle}</h2>
          <button
            aria-label={t('header.closeDrawer')}
            className="p-3 -m-2 hover:bg-zinc-800 rounded-lg transition"
            onClick={closeDrawer}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto" ref={drawerScrollContainerRef}>
          <LibrarySidebar
            libraries={libraries}
            onClick={closeDrawer}
            pagination={sidebarPagination}
            pinnedLibraries={pinnedLibraries}
            scrollContainerRef={drawerScrollContainerRef}
            summary={summary}
            userId={userId}
          />
        </div>
      </Dialog>
    </>
  )
}

function getLibraryPageKind(pathname: string): LibraryPageKind {
  if (pathname === '/library/bookmark') {
    return 'bookmark'
  }
  if (pathname === '/library/history') {
    return 'history'
  }
  if (pathname === '/library/rating') {
    return 'rating'
  }
  if (pathname === '/library') {
    return 'browse'
  }

  return 'detail'
}
