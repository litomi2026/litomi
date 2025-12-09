'use client'

import { useQueryClient } from '@tanstack/react-query'
import { UploadCloud } from 'lucide-react'
import ms from 'ms'
import { FormEvent, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { create } from 'zustand'

import { bulkCopyToLibrary } from '@/app/(navigation)/library/action-library-item'
import { MAX_ITEMS_PER_LIBRARY } from '@/constants/policy'
import { QueryKeys } from '@/constants/query'
import useActionResponse from '@/hook/useActionResponse'
import useDebouncedValue from '@/hook/useDebouncedValue'

import IconSpinner from '../icons/IconSpinner'
import IconX from '../icons/IconX'
import Modal from '../ui/Modal'

type ImportMangaModalStore = {
  libraryId: number | null
  setLibraryId: (libraryId: number | null) => void
}

const placeholder = `1234567
8879273
2345678, 3456789, 18827

쉼표 또는 여러 줄로 구분해서 입력하기`

export const useImportMangaModalStore = create<ImportMangaModalStore>()((set) => ({
  libraryId: null,
  setLibraryId: (libraryId: number | null) => set({ libraryId }),
}))

export default function MangaImportModal() {
  const [inputText, setInputText] = useState('')
  const debouncedInputText = useDebouncedValue({ value: inputText, delay: ms('0.5s') })
  const mangaIds = useMemo(() => parseIDs(debouncedInputText), [debouncedInputText])
  const { libraryId, setLibraryId } = useImportMangaModalStore()
  const queryClient = useQueryClient()

  const [, dispatchBulkImport, isImporting] = useActionResponse({
    action: bulkCopyToLibrary,
    onSuccess: (successCount, [{ mangaIds, toLibraryId }]) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraryItems(toLibraryId) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraries })

      if (successCount > 0) {
        const failedCount = mangaIds.length - successCount
        const extraMessage = failedCount > 0 ? ` (중복 ${failedCount}개)` : ''
        toast.success(`${successCount}개 작품을 가져왔어요${extraMessage}`)
        handleClose()
      } else {
        toast.error(`작품을 가져오는데 실패했어요`)
      }
    },
    shouldSetResponse: false,
  })

  function handleClose() {
    setLibraryId(null)
    setInputText('')
  }

  async function handleImport(e?: FormEvent) {
    e?.preventDefault()

    if (!libraryId) {
      toast.warning('서재를 선택해 주세요')
      return
    }

    if (mangaIds.length === 0) {
      toast.warning('유효한 작품 ID를 입력해 주세요')
      return
    }

    if (mangaIds.length > MAX_ITEMS_PER_LIBRARY) {
      toast.warning(`한 번에 최대 ${MAX_ITEMS_PER_LIBRARY}개까지 가져올 수 있어요`)
      return
    }

    dispatchBulkImport({ mangaIds, toLibraryId: libraryId })
  }

  return (
    <Modal
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-zinc-900 
        sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
        sm:w-full sm:max-w-prose sm:max-h-[calc(100dvh-4rem)] sm:rounded-xl sm:border-2"
      onClose={handleClose}
      open={Boolean(libraryId)}
    >
      <form className="flex flex-col flex-1 min-h-0" onSubmit={handleImport}>
        <div className="flex items-center justify-between p-4 bg-zinc-900 border-b-2 border-zinc-800 shrink-0">
          <h2 className="text-xl font-bold text-zinc-100">작품 가져오기</h2>
          <button
            className="p-2 -mr-2 rounded-lg hover:bg-zinc-800 transition sm:p-1.5 sm:-mr-1.5"
            disabled={isImporting}
            onClick={handleClose}
            title="닫기"
            type="button"
          >
            <IconX className="w-6 h-6 sm:w-5 sm:h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            작품 ID 입력
            <span className="ml-2 text-xs text-zinc-500">
              {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}+Enter로 제출 가능
            </span>
          </label>
          <textarea
            className="w-full min-h-32 max-h-96 px-3 py-2 bg-zinc-800 border-2 border-zinc-700 rounded-lg transition font-mono
            text-zinc-100 placeholder-zinc-500 focus:border-brand focus:outline-none"
            disabled={isImporting}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                if (!isImporting) {
                  handleImport()
                }
              }
            }}
            placeholder={placeholder}
            value={inputText}
          />
        </div>
        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-zinc-900 border-t-2 border-zinc-800 shrink-0">
          <button
            className="flex items-center justify-center gap-2 w-full px-4 py-3 text-background font-medium 
              bg-brand rounded-lg transition hover:bg-brand/90
              disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed"
            disabled={isImporting || mangaIds.length === 0 || !libraryId}
            type="submit"
          >
            {isImporting ? (
              <>
                <IconSpinner className="size-5" />
                <span>가져오는 중</span>
              </>
            ) : (
              <>
                <UploadCloud className="size-5" />
                <span>{mangaIds.length > 0 ? `${mangaIds.length}개 가져오기` : '가져오기'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function parseIDs(text: string): number[] {
  const idPattern = /\b\d+\b/g
  const matches = text.match(idPattern)

  if (!matches) {
    return []
  }

  const uniqueIds = [...new Set(matches.map(Number))]
  return uniqueIds
}
