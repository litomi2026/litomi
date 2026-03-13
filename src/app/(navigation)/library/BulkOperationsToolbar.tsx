'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, FolderInput, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useLibrarySelectionStore } from '@/app/(navigation)/library/[id]/librarySelection'
import Dialog from '@/components/ui/Dialog'
import DialogBody from '@/components/ui/DialogBody'
import DialogFooter from '@/components/ui/DialogFooter'
import DialogHeader from '@/components/ui/DialogHeader'
import { QueryKeys } from '@/constants/query'

import type { BulkOperationPermissions } from './bulkOperationPermissions'

import { bulkCopyToLibrary, bulkMoveToLibrary, bulkRemoveFromLibrary } from './api'

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

  const removeFromLibraryMutation = useMutation({
    mutationFn: bulkRemoveFromLibrary,
    onSuccess: ({ removedCount }, { libraryId }) => {
      toast.success(`${removedCount}개 작품을 제거했어요`)
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraries })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryListBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryMangasBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraryItems(libraryId) })
      exitSelectionMode()
    },
  })

  const copyToLibraryMutation = useMutation({
    mutationFn: bulkCopyToLibrary,
    onSuccess: ({ copiedCount }, { toLibraryId, mangaIds }) => {
      const alreadyExistsCount = mangaIds.length - copiedCount
      const extraMessage = alreadyExistsCount > 0 ? ` (실패: ${alreadyExistsCount}개)` : ''
      toast.success(`${copiedCount}개 작품을 복사했어요${extraMessage}`)
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraries })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryListBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryMangasBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraryItems(toLibraryId) })
      exitSelectionMode()
    },
  })

  const moveToLibraryMutation = useMutation({
    mutationFn: bulkMoveToLibrary,
    onSuccess: ({ movedCount }, { fromLibraryId, toLibraryId, mangaIds }) => {
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
  })

  const disabledReason = getDisabledReason(
    removeFromLibraryMutation.isPending,
    moveToLibraryMutation.isPending,
    copyToLibraryMutation.isPending,
    selectedCount,
  )

  const disabled = disabledReason !== ''

  function handleDelete() {
    if (!currentLibraryId) {
      return
    }

    if (!confirm(`선택한 ${selectedCount}개 작품을 이 서재에서 제거할까요?`)) {
      return
    }

    removeFromLibraryMutation.mutate({
      libraryId: currentLibraryId,
      mangaIds: Array.from(selectedItems),
    })
  }

  function handleLibrarySelect(targetLibraryId: number) {
    if (operation === 'move') {
      if (currentLibraryId) {
        moveToLibraryMutation.mutate({
          fromLibraryId: currentLibraryId,
          toLibraryId: targetLibraryId,
          mangaIds: Array.from(selectedItems),
        })
      }
    } else if (operation === 'copy') {
      copyToLibraryMutation.mutate({
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
      <Dialog ariaLabel={operation === 'move' ? '서재로 이동' : '서재에 복사'} onClose={handleClose} open={showModal}>
        <DialogHeader onClose={handleClose} title={operation === 'move' ? '서재로 이동' : '서재에 복사'} />

        <DialogBody>
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
        </DialogBody>

        <DialogFooter className="border-t-2 border-zinc-800">
          <button
            className="w-full px-4 py-3 text-zinc-300 font-medium bg-zinc-800 hover:bg-zinc-700
              disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg transition"
            disabled={disabled}
            onClick={handleClose}
            type="button"
          >
            취소
          </button>
        </DialogFooter>
      </Dialog>
    </>
  )
}

function getDisabledReason(isRemoving: boolean, isMoving: boolean, isCopying: boolean, selectedCount: number) {
  if (isRemoving) {
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
