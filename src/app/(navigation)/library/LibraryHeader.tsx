'use client'

import { Edit, Menu, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import MangaImportButton from '@/components/card/MangaImportButton'
import MangaImportModal from '@/components/card/MangaImportModal'

import AutoHideNavigation from '../AutoHideNavigation'
import { useLibrarySelectionStore } from './[id]/librarySelection'
import ShareLibraryButton from './[id]/ShareLibraryButton'
import { getBulkOperationPermissions } from './bulkOperationPermissions'
import LibraryManagementMenu from './LibraryManagementMenu'
import LibrarySidebar from './LibrarySidebar'
import useCurrentLibraryMeta from './useCurrentLibraryMeta'

const BulkOperationsToolbar = dynamic(() => import('./BulkOperationsToolbar'))

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
  userId,
  bookmarkCount,
  historyCount,
  ratingCount,
  sidebarPagination,
}: Props) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const drawerScrollContainerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const { enterSelectionMode, exitSelectionMode, isSelectionMode } = useLibrarySelectionStore()
  const { libraryId, currentLibrary } = useCurrentLibraryMeta({ libraries, userId })
  const isOwner = currentLibrary?.userId === userId
  const isGuest = !userId
  const isEmpty = currentLibrary?.itemCount === 0
  const isPublicLibrary = currentLibrary?.isPublic
  const currentLibraryId = currentLibrary?.id
  const headerTitle = getHeaderTitle()

  const permissions = getBulkOperationPermissions({
    pathname,
    isOwner,
    isPublicLibrary,
    userId,
    currentLibraryId,
  })

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false)
    document.body.style.overflow = ''
  }, [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDrawer()
        document.removeEventListener('keydown', handleKeyDown)
      }
    },
    [closeDrawer],
  )

  function getHeaderTitle() {
    if (pathname === '/library/history') {
      return '감상 기록'
    }
    if (pathname === '/library/bookmark') {
      return '북마크'
    }
    if (pathname === '/library/rating') {
      return '평가'
    }
    if (currentLibrary) {
      return currentLibrary.name
    }
    return isGuest ? '공개 서재 둘러보기' : '모든 서재'
  }

  function openDrawer() {
    setIsDrawerOpen(true)
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
  }

  function handleSelectionModeChange() {
    if (isSelectionMode) {
      exitSelectionMode()
    } else {
      enterSelectionMode()
    }
  }

  // NOTE: 서재 변경 시 선택 모드 종료하기
  useEffect(() => {
    exitSelectionMode()
  }, [libraryId, exitSelectionMode])

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
            className="p-1.5 -m-1.5 hover:bg-zinc-800 rounded-lg transition sm:hidden"
            onClick={openDrawer}
            type="button"
          >
            <Menu className="size-5" />
          </button>
          {!isSelectionMode && currentLibrary && (
            <div
              className="hidden size-10 rounded-lg sm:flex items-center bg-zinc-800 justify-center text-xl shrink-0"
              style={{ backgroundColor: currentLibrary?.color ?? '' }}
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
        {isSelectionMode && (
          <BulkOperationsToolbar
            currentLibraryId={currentLibraryId}
            libraries={libraries.filter((lib) => lib.userId === userId && lib.id !== currentLibrary?.id)}
            permissions={permissions}
          />
        )}
        <div className="flex items-center">
          {!isSelectionMode && isPublicLibrary && <ShareLibraryButton className="p-3" library={currentLibrary} />}
          {!isSelectionMode && isOwner && (
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
          {!isSelectionMode && isOwner && <LibraryManagementMenu className="-mr-1 p-3" library={currentLibrary} />}
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
              <h2 className="text-lg font-medium">{isGuest ? '공개 서재' : '서재'}</h2>
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
