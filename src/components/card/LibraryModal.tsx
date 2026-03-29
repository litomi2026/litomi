'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { create } from 'zustand'

import { addMangaToLibraries } from '@/app/(navigation)/library/api'
import Dialog from '@/components/ui/Dialog'
import DialogBody from '@/components/ui/DialogBody'
import DialogFooter from '@/components/ui/DialogFooter'
import DialogHeader from '@/components/ui/DialogHeader'
import { QueryKeys } from '@/constants/query'

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
  const queryClient = useQueryClient()
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<Set<number>>(new Set())

  const {
    data: libraries,
    isError: isLibrariesError,
    isPending: isLibrariesPending,
    refetch: refetchLibraries,
  } = useLibrariesQuery({ enabled: isOpen })

  const addToLibrariesMutation = useMutation({
    mutationFn: addMangaToLibraries,
    onSuccess: ({ addedCount }, { libraryIds }) => {
      if (addedCount === 0) {
        toast.warning(`해당 서재에 이미 추가되어 있어요`)
        return
      }

      if (addedCount === libraryIds.length) {
        toast.success(`${addedCount}개 서재에 추가했어요`)
      } else if (addedCount > 0) {
        toast.success(`${addedCount}개 서재에 추가했어요 (중복 ${libraryIds.length - addedCount}개)`)
      }

      queryClient.invalidateQueries({ queryKey: QueryKeys.libraries })

      for (const id of libraryIds) {
        queryClient.invalidateQueries({ queryKey: QueryKeys.libraryItemsBase(id) })
      }

      requestClose()
    },
  })

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    handleAddToLibraries()
  }

  function requestClose() {
    setIsOpen(false)
  }

  function handleAfterClose() {
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
    addToLibrariesMutation.mutate({ mangaId, libraryIds })
  }

  return (
    <Dialog
      ariaLabel="서재에 추가"
      className="sm:max-w-prose"
      onAfterClose={handleAfterClose}
      onClose={requestClose}
      open={isOpen}
    >
      <form className="flex flex-1 flex-col min-h-0" onSubmit={handleSubmit}>
        <DialogHeader onClose={requestClose} title="서재에 추가" />

        <DialogBody className="flex flex-col gap-4">
          {isLibrariesPending ? (
            <div className="flex flex-1 items-center justify-center py-12">
              <div className="flex items-center gap-2 text-zinc-400">
                <Loader2 className="size-5 animate-spin" />
                <span className="text-sm">불러오는 중이에요</span>
              </div>
            </div>
          ) : isLibrariesError ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12 text-center">
              <p className="text-sm text-zinc-400">서재 목록을 불러오지 못했어요</p>
              <button
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition font-medium text-zinc-200"
                onClick={() => refetchLibraries()}
                type="button"
              >
                다시 시도
              </button>
            </div>
          ) : libraries?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-400 mb-6">아직 서재가 없어요</p>
              <Link
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand hover:bg-brand/90
                  transition font-semibold text-background"
                href="/library"
                onClick={requestClose}
                prefetch={false}
              >
                <Plus className="size-5 shrink-0" />
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
                  disabled={addToLibrariesMutation.isPending}
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
        </DialogBody>

        {libraries && libraries.length > 0 && (
          <DialogFooter className="border-t-2 border-zinc-800 space-y-2">
            <button
              className="flex items-center justify-center gap-2 w-full px-4 py-3 text-background font-medium bg-brand rounded-lg transition hover:bg-brand/90
                disabled:bg-zinc-700 disabled:text-zinc-500"
              disabled={addToLibrariesMutation.isPending || selectedLibraryIds.size === 0}
              type="submit"
            >
              {addToLibrariesMutation.isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Plus className="size-5" />
              )}
              <span>
                {selectedLibraryIds.size > 0 ? `${selectedLibraryIds.size}개 서재에 추가` : '서재를 선택해 주세요'}
              </span>
            </button>
            <button
              className="w-full px-4 py-3 text-zinc-300 font-medium bg-zinc-800 rounded-lg transition hover:bg-zinc-700
                disabled:bg-zinc-700 disabled:text-zinc-500"
              disabled={addToLibrariesMutation.isPending}
              onClick={requestClose}
              type="button"
            >
              취소
            </button>
          </DialogFooter>
        )}
      </form>
    </Dialog>
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
