'use client'

import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { create } from 'zustand'

import { addMangaToLibraries } from '@/app/(navigation)/library/action-library-item'
import { QueryKeys } from '@/constants/query'
import useActionResponse from '@/hook/useActionResponse'

import IconPlus from '../icons/IconPlus'
import IconSpinner from '../icons/IconSpinner'
import IconX from '../icons/IconX'
import Modal from '../ui/Modal'
import useLibrariesQuery from './useLibrariesQuery'

type LibraryModalStore = {
  isOpen: boolean
  mangaId: number | null
  setIsOpen: (isOpen: boolean) => void
  setMangaId: (mangaId: number | null) => void
}

const useLibraryModalStore = create<LibraryModalStore>()((set) => ({
  isOpen: false,
  mangaId: null,
  setIsOpen: (isOpen: boolean) => set({ isOpen }),
  setMangaId: (mangaId: number | null) => set({ mangaId }),
}))

export default function LibraryModal() {
  const { isOpen, mangaId, setIsOpen, setMangaId } = useLibraryModalStore()
  const { data: libraries } = useLibrariesQuery({ enabled: isOpen })
  const queryClient = useQueryClient()
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<Set<number>>(new Set())

  const [, dispatchAddToLibraries, isPending] = useActionResponse({
    action: addMangaToLibraries,
    onSuccess: (successCount, [{ libraryIds }]) => {
      if (successCount === 0) {
        toast.warning(`해당 서재에 이미 추가되어 있어요`)
        return
      }

      if (successCount === libraryIds.length) {
        toast.success(`${successCount}개 서재에 추가했어요`)
      } else if (successCount > 0) {
        toast.success(`${successCount}개 서재에 추가했어요 (중복 ${libraryIds.length - successCount}개)`)
      }

      queryClient.invalidateQueries({ queryKey: QueryKeys.libraries })

      for (const id of libraryIds) {
        queryClient.invalidateQueries({ queryKey: QueryKeys.libraryItems(id) })
      }

      handleClose()
    },
    shouldSetResponse: false,
  })

  function handleClose() {
    setIsOpen(false)
    setMangaId(null)
    setSelectedLibraryIds(new Set())
  }

  function handleLibraryToggle(libraryId: number) {
    setSelectedLibraryIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(libraryId)) {
        newSet.delete(libraryId)
      } else {
        newSet.add(libraryId)
      }
      return newSet
    })
  }

  function handleAddToLibraries() {
    if (!mangaId || selectedLibraryIds.size === 0) {
      return
    }

    const libraryIds = Array.from(selectedLibraryIds)
    dispatchAddToLibraries({ mangaId, libraryIds })
  }

  return (
    <Modal
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-zinc-900 
        sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
        sm:w-full sm:max-w-prose sm:max-h-[calc(100dvh-4rem)] sm:rounded-xl sm:border-2"
      onClose={handleClose}
      open={isOpen}
    >
      <form action={handleAddToLibraries} className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between p-4 bg-zinc-900 border-b-2 border-zinc-800 shrink-0">
          <h2 className="text-xl font-bold text-zinc-100">서재에 추가</h2>
          <button
            className="p-2 -mr-2 rounded-lg hover:bg-zinc-800 transition sm:p-1.5 sm:-mr-1.5"
            onClick={handleClose}
            title="닫기"
            type="button"
          >
            <IconX className="w-6 h-6 sm:w-5 sm:h-5" />
          </button>
        </div>
        <div className="flex flex-col gap-4 flex-1 overflow-y-auto p-4">
          {libraries?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-400 mb-6">아직 서재가 없어요</p>
              <Link
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand hover:bg-brand/90
                transition font-semibold text-background"
                href="/library"
                onClick={handleClose}
              >
                <IconPlus className="w-5" />
                <span>서재 만들기</span>
              </Link>
            </div>
          ) : (
            libraries?.map((library) => (
              <label
                className="flex items-center gap-3 w-full p-3 rounded-lg border-2 hover:bg-zinc-800 hover:border-zinc-600 transition cursor-pointer"
                key={library.id}
              >
                <input
                  checked={selectedLibraryIds.has(library.id)}
                  className="size-4 rounded border-2 border-zinc-600 bg-zinc-800"
                  disabled={isPending}
                  onChange={() => handleLibraryToggle(library.id)}
                  type="checkbox"
                />
                <div
                  className="size-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: typeof library.color === 'string' ? library.color : '#3B82F6' }}
                >
                  <span className="text-lg">{library.icon || '📚'}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium break-all line-clamp-1 text-zinc-100">{library.name}</h3>
                  <p className="text-sm text-zinc-400">{library.itemCount}개 작품</p>
                </div>
              </label>
            ))
          )}
        </div>
        {libraries && libraries.length > 0 && (
          <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-zinc-900 border-t-2 border-zinc-800 shrink-0 space-y-2">
            <button
              className="flex items-center justify-center gap-2 w-full px-4 py-3 text-background font-medium bg-brand rounded-lg transition hover:bg-brand/90
              disabled:bg-zinc-700 disabled:text-zinc-500"
              disabled={isPending || selectedLibraryIds.size === 0}
              type="submit"
            >
              {isPending ? <IconSpinner className="size-5" /> : <IconPlus className="size-5" />}
              <span>
                {selectedLibraryIds.size > 0 ? `${selectedLibraryIds.size}개 서재에 추가` : '서재를 선택해주세요'}
              </span>
            </button>
            <button
              className="w-full px-4 py-3 text-zinc-300 font-medium bg-zinc-800 rounded-lg transitionhover:bg-zinc-700
              disabled:bg-zinc-700 disabled:text-zinc-500"
              disabled={isPending}
              onClick={handleClose}
              type="button"
            >
              취소
            </button>
          </div>
        )}
      </form>
    </Modal>
  )
}

export function useLibraryModal() {
  const { setIsOpen, setMangaId } = useLibraryModalStore()

  const open = useCallback(
    (mangaId: number) => {
      setMangaId(mangaId)
      setIsOpen(true)
    },
    [setIsOpen, setMangaId],
  )

  return { open }
}
