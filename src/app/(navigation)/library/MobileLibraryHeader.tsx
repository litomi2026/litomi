'use client'

import { Menu, MoreVertical, X } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useCallback, useState } from 'react'

import type { LibraryWithCount } from '@/app/api/library/route'

import BulkOperationsToolbar from './[id]/BulkOperationsToolbar'
import { useLibrarySelectionStore } from './[id]/librarySelection'
import LibrarySidebar from './LibrarySidebar'

type Params = {
  id: string
}

type Props = {
  libraries: LibraryWithCount[]
  userId: string | null
}

export default function MobileLibraryHeader({ libraries, userId }: Readonly<Props>) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const { id } = useParams<Params>()
  const { enterSelectionMode, exitSelectionMode, isSelectionMode, selectedItems } = useLibrarySelectionStore()
  const selectedCount = selectedItems.size
  const currentLibrary = id ? libraries.find((lib) => lib.id === Number(id)) : null
  const isOwner = currentLibrary?.userId === Number(userId)
  const isGuest = !userId

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

  return (
    <>
      <div className="sticky top-0 z-40 flex justify-between items-center gap-3 p-4 bg-zinc-950 border-b border-zinc-800 sm:hidden">
        <div className="flex items-center gap-3">
          <button
            aria-label="library-menu"
            className="p-2 -m-1 -mx-2 hover:bg-zinc-800 rounded-lg transition-colors"
            onClick={openDrawer}
            type="button"
          >
            <Menu className="size-5" />
          </button>
          {currentLibrary ? (
            !isSelectionMode && <h1 className="text-lg font-medium line-clamp-1 break-all">{currentLibrary.name}</h1>
          ) : (
            <span className="text-lg font-medium">{isGuest ? '공개 서재' : '모든 서재'}</span>
          )}
        </div>
        {isSelectionMode && selectedCount > 0 && currentLibrary && (
          <BulkOperationsToolbar currentLibraryId={currentLibrary.id} />
        )}
        {isOwner && (
          <button
            className="p-2 -m-1 -mx-2 hover:bg-zinc-800 rounded-lg transition"
            onClick={handleSelectionModeChange}
            title={isSelectionMode ? '선택 모드 종료' : '선택 모드'}
            type="button"
          >
            {isSelectionMode ? <X className="size-5" /> : <MoreVertical className="size-5" />}
          </button>
        )}
      </div>

      {/* Mobile Drawer */}
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
