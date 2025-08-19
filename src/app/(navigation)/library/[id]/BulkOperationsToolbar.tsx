'use client'

import { useQueryClient } from '@tanstack/react-query'
import { Copy, FolderInput, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { useLibrarySelectionStore } from '@/app/(navigation)/library/[id]/librarySelection'
import useLibrariesQuery from '@/app/(navigation)/library/[id]/useLibrariesQuery'
import Modal from '@/components/ui/Modal'
import { QueryKeys } from '@/constants/query'
import useActionResponse from '@/hook/useActionResponse'

import { bulkCopyToLibrary, bulkMoveToLibrary, bulkRemoveFromLibrary } from '../actions'

type Props = {
  currentLibraryId: number
}

export default function BulkOperationsToolbar({ currentLibraryId }: Props) {
  const queryClient = useQueryClient()
  const { selectedItems, exitSelectionMode } = useLibrarySelectionStore()
  const [showModal, setShowModal] = useState(false)
  const [operation, setOperation] = useState<'copy' | 'move'>('move')
  const targetLibraryIdRef = useRef(0)
  const { data: librariesData } = useLibrariesQuery()
  const libraries = librariesData?.libraries
  const selectedCount = selectedItems.size

  function handleMove() {
    setOperation('move')
    setShowModal(true)
  }

  function handleCopy() {
    setOperation('copy')
    setShowModal(true)
  }

  const [_, dispatchDeletingAction, isDeleting] = useActionResponse({
    action: bulkRemoveFromLibrary,
    onSuccess: (deletedCount) => {
      toast.success(`${deletedCount}개 작품을 제거했어요`)
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraries })
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraryItems(currentLibraryId) })
      exitSelectionMode()
    },
    shouldSetResponse: false,
  })

  const [__, dispatchMovingOrCopyingAction, isMovingOrCopying] = useActionResponse({
    action: operation === 'move' ? bulkMoveToLibrary : bulkCopyToLibrary,
    onSuccess: (processedCount) => {
      toast.success(`${processedCount}개 작품을 ${operation === 'move' ? '이동' : '복사'}했어요`)
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraries })
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraryItems(currentLibraryId) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraryItems(targetLibraryIdRef.current) })
      exitSelectionMode()
      setShowModal(false)
    },
    shouldSetResponse: false,
  })

  const isProcessing = isDeleting || isMovingOrCopying

  function handleDelete() {
    if (!confirm(`선택한 ${selectedCount}개 작품을 이 서재에서 제거할까요?`)) {
      return
    }

    dispatchDeletingAction({
      libraryId: currentLibraryId,
      mangaIds: Array.from(selectedItems),
    })
  }

  function handleLibrarySelect(targetLibraryId: number) {
    targetLibraryIdRef.current = targetLibraryId
    dispatchMovingOrCopyingAction({
      fromLibraryId: currentLibraryId,
      toLibraryId: targetLibraryId,
      mangaIds: Array.from(selectedItems),
    })
  }

  return (
    <>
      <div className="flex-1 flex items-center justify-between gap-2">
        <span className="text-sm sm:text-base font-medium">{selectedCount}개 선택</span>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-3 py-1.5 -my-2 bg-zinc-800 hover:bg-zinc-700 
              rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isProcessing}
            onClick={handleMove}
            type="button"
          >
            <FolderInput className="size-5" />
            <span className="hidden sm:block">이동</span>
          </button>
          <button
            className="flex items-center gap-2 px-3 py-1.5 -my-2 bg-zinc-800 hover:bg-zinc-700 
              rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isProcessing}
            onClick={handleCopy}
            type="button"
          >
            <Copy className="size-5" />
            <span className="hidden sm:block">복사</span>
          </button>
          <button
            className="flex items-center gap-2 px-3 py-1.5 -my-2 bg-red-900/50 hover:bg-red-900/70 
              text-red-400 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isProcessing}
            onClick={handleDelete}
            type="button"
          >
            <Trash2 className="size-5" />
            <span className="hidden sm:block">제거</span>
          </button>
        </div>
      </div>
      <Modal onClose={() => setShowModal(false)} open={showModal} showCloseButton>
        <div className="grid gap-3 bg-zinc-900 w-screen max-w-md rounded-3xl border-2 p-6">
          <h2 className="text-xl font-bold mb-2">{operation === 'move' ? '서재로 이동' : '서재에 복사'}</h2>
          <div className="grid gap-2">
            {libraries
              ?.filter((lib) => lib.id !== currentLibraryId)
              .map((library) => (
                <button
                  className="group flex items-center gap-3 py-3 rounded-lg transition text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isProcessing}
                  key={library.id}
                  onClick={() => handleLibrarySelect(library.id)}
                >
                  <div
                    className="size-8 rounded-lg flex items-center justify-center bg-zinc-800"
                    style={{ backgroundColor: library.color ?? '' }}
                  >
                    <span className="text-sm">{library.icon || library.name.slice(0, 1)}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium line-clamp-1 break-all group-hover:underline">{library.name}</h3>
                    <p className="text-xs text-zinc-500">{library.itemCount}개</p>
                  </div>
                </button>
              ))}
          </div>
          <button
            className="w-full px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition font-medium"
            onClick={() => setShowModal(false)}
          >
            취소
          </button>
        </div>
      </Modal>
    </>
  )
}
