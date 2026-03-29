'use client'

import { Edit, Menu, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import MangaImportButton from '@/components/card/MangaImportButton'
import MangaImportModal from '@/components/card/MangaImportModal'

import type { BulkActionDescriptor, BulkTargetLibrary } from './bulkActionTypes'

import AutoHideNavigation from '../AutoHideNavigation'
import ShareLibraryButton from './[id]/ShareLibraryButton'
import useBulkDeleteBookmarkAction from './bookmark/useBulkDeleteBookmarkAction'
import { getBulkOperationPermissions } from './bulkOperationPermissions'
import HistoryClearAllButton from './history/HistoryClearAllButton'
import useBulkDeleteReadingHistoryAction from './history/useBulkDeleteReadingHistoryAction'
import LibraryManagementMenu from './LibraryManagementMenu'
import { useLibrarySelection } from './librarySelection'
import LibrarySidebar from './LibrarySidebar'
import PinLibraryButton from './PinLibraryButton'
import useBulkDeleteRatingAction from './rating/useBulkDeleteRatingAction'
import useBulkCopyToLibraryAction from './useBulkCopyToLibraryAction'
import useBulkMoveToLibraryAction from './useBulkMoveToLibraryAction'
import useBulkRemoveFromLibraryAction from './useBulkRemoveFromLibraryAction'
import useCurrentLibraryMeta from './useCurrentLibraryMeta'

const BulkOperationsToolbar = dynamic(() => import('./BulkOperationsToolbar'))

type LibraryPageKind = 'bookmark' | 'browse' | 'detail' | 'history' | 'rating'

type Props = {
  libraries: {
    id: number
    name: string
    description: string | null
    color: string | null
    icon: string | null
    userId: number
    isPublic: boolean
    createdAt: number
    itemCount: number
  }[]
  pinnedLibraries?: {
    id: number
    name: string
    description: string | null
    color: string | null
    icon: string | null
    userId: number
    isPublic: boolean
    createdAt: number
    itemCount: number
  }[]
  userId?: number
  bookmarkCount?: number
  historyCount?: number
  ratingCount?: number
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
  bookmarkCount,
  historyCount,
  ratingCount,
  sidebarPagination,
}: Props) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const drawerScrollContainerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const pageKind = getLibraryPageKind(pathname)
  const { isSelectionMode, enter, exit } = useLibrarySelection()
  const { currentLibrary } = useCurrentLibraryMeta({ libraries, userId })
  const deleteBookmarksAction = useBulkDeleteBookmarkAction()
  const deleteReadingHistoryAction = useBulkDeleteReadingHistoryAction({ userId })
  const deleteRatingsAction = useBulkDeleteRatingAction()

  const permissions = getBulkOperationPermissions(pageKind, currentLibrary, userId)
  const isOwner = currentLibrary?.userId === userId
  const isPublicLibrary = currentLibrary?.isPublic
  const currentLibraryId = currentLibrary?.id

  const headerTitle = {
    bookmark: '북마크',
    browse: '공개 서재 둘러보기',
    detail: currentLibrary?.name ?? '서재',
    history: '감상 기록',
    rating: '평가',
  }[pageKind]

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

  useEffect(() => {
    if (!isDrawerOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDrawerOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isDrawerOpen])

  return (
    <>
      <header
        className="sticky top-0 z-40 flex justify-between items-center gap-3 p-2.5 sm:p-3 border-b border-zinc-800 transition bg-background aria-busy:opacity-50"
        data-header
      >
        <AutoHideNavigation selector="[data-header]" />
        <div className="flex items-center gap-3">
          <button
            aria-label="library-menu"
            className="p-3 -mx-2 hover:bg-zinc-800 rounded-lg transition sm:hidden"
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
              {currentLibrary.icon?.slice(0, 2) ?? currentLibrary.name[0]}
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
          {!isSelectionMode && pageKind === 'history' && userId && (
            <HistoryClearAllButton historyCount={historyCount} userId={userId} />
          )}
          {!isSelectionMode && isPublicLibrary && currentLibrary && (
            <>
              <PinLibraryButton className="p-3" library={currentLibrary} libraryId={currentLibrary.id} />
              <ShareLibraryButton className="p-3" library={currentLibrary} />
            </>
          )}
          {!isSelectionMode && isOwner && currentLibrary && (
            <>
              <MangaImportButton libraryId={currentLibrary.id} />
              <MangaImportModal />
            </>
          )}
          {permissions.canSelectItems && (
            <button
              className="p-3 hover:bg-zinc-800 rounded-lg transition disabled:opacity-50"
              disabled={isEmpty}
              onClick={handleSelectionModeChange}
              title={isEmpty ? '작품이 없어요' : '선택 모드 전환'}
              type="button"
            >
              {isSelectionMode ? <X className="size-5" /> : <Edit className="size-5" />}
            </button>
          )}
          {!isSelectionMode && isOwner && currentLibrary && (
            <LibraryManagementMenu className="-mr-1 p-3" library={currentLibrary} />
          )}
        </div>
      </header>
      {isDrawerOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-background/50 animate-fade-in-fast sm:hidden" onClick={closeDrawer} />
          <div
            className="fixed top-0 left-0 z-50 h-full w-3xs bg-background border-r shadow-xl animate-fade-in-fast sm:hidden overflow-y-auto"
            ref={drawerScrollContainerRef}
          >
            <div className="sticky top-0 bg-background flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-lg font-medium">{pageKind === 'browse' ? '공개 서재' : '서재'}</h2>
              <button
                className="p-3 -m-2 hover:bg-zinc-800 rounded-lg transition"
                onClick={closeDrawer}
                title="close drawer"
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>
            <LibrarySidebar
              bookmarkCount={bookmarkCount}
              className="pb-safe"
              historyCount={historyCount}
              libraries={libraries}
              onClick={closeDrawer}
              pagination={sidebarPagination}
              pinnedLibraries={pinnedLibraries}
              ratingCount={ratingCount}
              scrollContainerRef={drawerScrollContainerRef}
              userId={userId}
            />
          </div>
        </>
      )}
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
