'use client'

import { Edit, Menu, X } from 'lucide-react'
import ms from 'ms'
import dynamic from 'next/dynamic'
import { useParams, usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import useThrottledDownScroll from '@/hook/useThrottledScroll'

import { useLibrarySelectionStore } from './[id]/librarySelection'
import ShareLibraryButton from './[id]/ShareLibraryButton'
import LibraryManagementMenu from './LibraryManagementMenu'
import LibrarySidebar from './LibrarySidebar'

const BulkOperationsToolbar = dynamic(() => import('./[id]/BulkOperationsToolbar'))

const SCROLL_THROTTLE_MS = ms('0.3s')
const SCROLL_THRESHOLD_PX = 10

type Params = {
  id: string
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
}

export default function LibraryHeader({ libraries, userId }: Readonly<Props>) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const isDownScroll = useThrottledDownScroll({ threshold: SCROLL_THRESHOLD_PX, throttle: SCROLL_THROTTLE_MS })
  const pathname = usePathname()
  const { id: libraryId } = useParams<Params>()
  const { enterSelectionMode, exitSelectionMode, isSelectionMode } = useLibrarySelectionStore()
  const currentLibrary = libraryId ? libraries.find((lib) => lib.id === Number(libraryId)) : null
  const isOwner = currentLibrary?.userId === userId
  const isGuest = !userId
  const headerTitle = getHeaderTitle()

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

  function removeAriaHidden(e: React.MouseEvent<HTMLDivElement>) {
    const element = e.currentTarget
    element.removeAttribute('aria-hidden')
  }

  // NOTE: 서재 변경 시 선택 모드 종료하기
  useEffect(() => {
    exitSelectionMode()
  }, [libraryId, exitSelectionMode])

  return (
    <>
      <div
        aria-hidden={isDownScroll}
        className="sticky top-0 z-40 flex justify-between items-center gap-3 p-4 border-b border-zinc-800 transition bg-zinc-950 aria-hidden:opacity-50"
        onClick={removeAriaHidden}
      >
        <div className="flex items-center gap-3">
          <button
            aria-label="library-menu"
            className="p-2 -m-1 -mx-2 hover:bg-zinc-800 rounded-lg transition sm:hidden"
            onClick={openDrawer}
            type="button"
          >
            <Menu className="size-5" />
          </button>
          {!isSelectionMode && currentLibrary && (
            <div
              className="hidden size-10 my-1 mr-2 rounded-lg sm:flex items-center bg-zinc-800 justify-center text-xl shrink-0"
              style={{ backgroundColor: currentLibrary?.color ?? '' }}
            >
              {currentLibrary.icon?.slice(0, 2) ?? currentLibrary.name[0]}
            </div>
          )}
          {!isSelectionMode && (
            <div className="grid flex-1 break-all">
              <h1 className="text-lg font-medium line-clamp-1 sm:text-xl sm:font-bold" title={headerTitle}>
                {headerTitle}
              </h1>
              {currentLibrary?.description && (
                <p className="max-sm:hidden text-sm text-zinc-400 line-clamp-1">{currentLibrary.description}</p>
              )}
            </div>
          )}
        </div>
        {isSelectionMode && currentLibrary && (
          <BulkOperationsToolbar currentLibraryId={currentLibrary.id} libraries={libraries} />
        )}
        <div className="flex items-center gap-1">
          {!isSelectionMode && currentLibrary && <ShareLibraryButton className="p-2" library={currentLibrary} />}
          {isOwner && (
            <button
              className="p-2 hover:bg-zinc-800 rounded-lg transition"
              onClick={handleSelectionModeChange}
              title={isSelectionMode ? '선택 모드 종료' : '선택 모드'}
              type="button"
            >
              {isSelectionMode ? <X className="size-5" /> : <Edit className="size-5" />}
            </button>
          )}
          {isOwner && !isSelectionMode && <LibraryManagementMenu className="-mr-1" library={currentLibrary} />}
        </div>
      </div>
      {isDrawerOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 animate-fade-in-fast sm:hidden" onClick={closeDrawer} />
          <div className="fixed top-0 left-0 z-50 h-full w-3xs bg-zinc-950 border-r shadow-xl animate-fade-in-fast sm:hidden overflow-y-auto">
            <div className="sticky top-0 bg-zinc-950 flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-lg font-medium">{isGuest ? '공개 서재' : '서재'}</h2>
              <button
                className="p-2 -m-2 hover:bg-zinc-800 rounded-lg transition"
                onClick={closeDrawer}
                title="close drawer"
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>
            <LibrarySidebar className="pb-safe" libraries={libraries} onClick={closeDrawer} userId={userId} />
          </div>
        </>
      )}
    </>
  )
}
