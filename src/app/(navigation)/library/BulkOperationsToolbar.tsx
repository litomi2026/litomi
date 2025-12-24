'use client'

import { useQueryClient } from '@tanstack/react-query'
import { Copy, FolderInput, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useLibrarySelectionStore } from '@/app/(navigation)/library/[id]/librarySelection'
import Modal from '@/components/ui/Modal'
import { QueryKeys } from '@/constants/query'
import useServerAction from '@/hook/useServerAction'

import type { BulkOperationPermissions } from './bulkOperationPermissions'

import { bulkCopyToLibrary, bulkMoveToLibrary, bulkRemoveFromLibrary } from './action-library-item'

type Props = {
  libraries: {
    id: number
    name: string
    color: string | null
    icon: string | null
    itemCount: number
  }[]
  currentLibraryId?: number
  permissions: BulkOperationPermissions
}

export default function BulkOperationsToolbar({ libraries, currentLibraryId, permissions }: Props) {
  const queryClient = useQueryClient()
  const { selectedItems, exitSelectionMode } = useLibrarySelectionStore()
  const [showModal, setShowModal] = useState(false)
  const [operation, setOperation] = useState<'copy' | 'move'>(permissions.canMove ? 'move' : 'copy')
  const selectedCount = selectedItems.size

  function handleClose() {
    setShowModal(false)
  }

  function handleMove() {
    setOperation('move')
    setShowModal(true)
  }

  function handleCopy() {
    setOperation('copy')
    setShowModal(true)
  }

  const [, dispatchDeletingAction, isDeleting] = useServerAction({
    action: bulkRemoveFromLibrary,
    onSuccess: (deletedCount, [{ libraryId }]) => {
      toast.success(`${deletedCount}개 작품을 제거했어요`)
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraries })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryListBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryMangasBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraryItems(libraryId) })
      exitSelectionMode()
    },
    shouldSetResponse: false,
  })

  const [, dispatchCopyingAction, isCopying] = useServerAction({
    action: bulkCopyToLibrary,
    onSuccess: (copiedCount, [{ toLibraryId, mangaIds }]) => {
      const alreadyExistsCount = mangaIds.length - copiedCount
      const extraMessage = alreadyExistsCount > 0 ? ` (실패: ${alreadyExistsCount}개)` : ''
      toast.success(`${copiedCount}개 작품을 복사했어요${extraMessage}`)
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraries })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryListBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryMangasBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraryItems(toLibraryId) })
      exitSelectionMode()
    },
    shouldSetResponse: false,
  })

  const [_, dispatchMovingAction, isMoving] = useServerAction({
    action: bulkMoveToLibrary,
    onSuccess: (movedCount, [{ fromLibraryId, toLibraryId, mangaIds }]) => {
      const alreadyExistsCount = mangaIds.length - movedCount
      const extraMessage = alreadyExistsCount > 0 ? ` (실패: ${alreadyExistsCount}개)` : ''
      toast.success(`${movedCount}개 작품을 이동했어요${extraMessage}`)
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraries })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryListBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryMangasBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraryItems(fromLibraryId) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraryItems(toLibraryId) })
      exitSelectionMode()
    },
    shouldSetResponse: false,
  })

  const disabledReason = getDisabledReason(isDeleting, isMoving, isCopying, selectedCount)
  const disabled = disabledReason !== ''

  function handleDelete() {
    if (!currentLibraryId) {
      return
    }

    if (!confirm(`선택한 ${selectedCount}개 작품을 이 서재에서 제거할까요?`)) {
      return
    }

    dispatchDeletingAction({
      libraryId: currentLibraryId,
      mangaIds: Array.from(selectedItems),
    })
  }

  function handleLibrarySelect(targetLibraryId: number) {
    if (operation === 'move') {
      if (currentLibraryId) {
        dispatchMovingAction({
          fromLibraryId: currentLibraryId,
          toLibraryId: targetLibraryId,
          mangaIds: Array.from(selectedItems),
        })
      }
    } else if (operation === 'copy') {
      dispatchCopyingAction({
        toLibraryId: targetLibraryId,
        mangaIds: Array.from(selectedItems),
      })
    }
  }

  return (
    <>
      <div className="flex-1 flex items-center justify-between gap-2">
        <span className="py-2.5 text-sm sm:text-base font-medium">{selectedCount}개 선택</span>
        <div className="flex items-center gap-2">
          {permissions.canMove && (
            <button
              className="flex items-center gap-2 p-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 
              rounded-lg transition disabled:opacity-50"
              disabled={disabled}
              onClick={handleMove}
              title={disabledReason}
              type="button"
            >
              <FolderInput className="size-5" />
              <span className="hidden sm:block">이동</span>
            </button>
          )}
          {permissions.canCopy && (
            <button
              className="flex items-center gap-2 p-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 
              rounded-lg transition disabled:opacity-50"
              disabled={disabled}
              onClick={handleCopy}
              title={disabledReason}
              type="button"
            >
              <Copy className="size-5" />
              <span className="hidden sm:block">복사</span>
            </button>
          )}
          {permissions.canDelete && (
            <button
              className="flex items-center gap-2 p-3 py-1.5 bg-red-900/50 hover:bg-red-900/70 
              text-red-400 rounded-lg transition disabled:opacity-50"
              disabled={disabled}
              onClick={handleDelete}
              title={disabledReason}
              type="button"
            >
              <Trash2 className="size-5" />
              <span className="hidden sm:block">제거</span>
            </button>
          )}
        </div>
      </div>
      <Modal
        className="fixed inset-0 z-50 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2
          flex flex-col overflow-hidden
          bg-zinc-900 sm:w-full sm:max-w-md sm:max-h-[calc(100dvh-4rem)] sm:border-2 sm:rounded-xl sm:-translate-y-1/2"
        onClose={handleClose}
        open={showModal}
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-zinc-900 border-b-2 shrink-0">
            <h2 className="text-xl font-bold text-zinc-100">{operation === 'move' ? '서재로 이동' : '서재에 복사'}</h2>
            <button className="p-2 rounded-lg hover:bg-zinc-800 transition -m-1" onClick={handleClose} type="button">
              <X className="size-5" />
            </button>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            <p className="text-sm text-zinc-400 mb-4">
              {selectedCount}개 작품을 {operation === 'move' ? '이동할' : '복사할'} 서재를 선택하세요
            </p>
            <div className="space-y-2">
              {libraries.map((library) => (
                <button
                  className="w-full flex items-center gap-3 p-3 rounded-lg border-2
                      hover:bg-zinc-800 hover:border-zinc-600 transition text-left 
                      disabled:opacity-50"
                  disabled={disabled}
                  key={library.id}
                  onClick={() => handleLibrarySelect(library.id)}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: library.color ?? '#3B82F6' }}
                  >
                    <span className="text-lg">{library.icon || '📚'}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-zinc-100 line-clamp-1 break-all">{library.name}</h3>
                    <p className="text-sm text-zinc-400">{library.itemCount}개 작품</p>
                  </div>
                </button>
              ))}
            </div>
            {libraries.filter((lib) => lib.id !== currentLibraryId).length === 0 && (
              <p className="text-center text-zinc-500 py-8">이동할 수 있는 다른 서재가 없어요</p>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-zinc-900 border-t-2 shrink-0">
            <button
              className="w-full px-4 py-3 text-zinc-300 font-medium bg-zinc-800 hover:bg-zinc-700
                disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg transition"
              disabled={disabled}
              onClick={handleClose}
              type="button"
            >
              취소
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

function getDisabledReason(isDeleting: boolean, isMoving: boolean, isCopying: boolean, selectedCount: number) {
  if (isDeleting) {
    return '삭제 중'
  }
  if (isMoving) {
    return '이동 중'
  }
  if (isCopying) {
    return '복사 중'
  }
  if (selectedCount === 0) {
    return '선택된 작품이 없어요'
  }
  return ''
}
