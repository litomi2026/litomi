'use client'

import { type InfiniteData, useQueryClient } from '@tanstack/react-query'
import { Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import type { GETLibraryResponse } from '@/backend/api/v1/library/GET'
import type { GETV1LibraryListResponse } from '@/backend/api/v1/library/list'

import Modal from '@/components/ui/Modal'
import { QueryKeys } from '@/constants/query'
import useServerAction from '@/hook/useServerAction'

import { deleteLibrary } from './action-library'

type Props = {
  libraryId: number
  libraryName: string
  itemCount: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function LibraryDeleteModal({ libraryId, libraryName, itemCount, open, onOpenChange }: Readonly<Props>) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [_, dispatchAction, isPending] = useServerAction({
    action: deleteLibrary,
    onSuccess: (deletedLibraryId) => {
      queryClient.setQueryData<GETLibraryResponse>(QueryKeys.libraries, (oldLibraries) => {
        if (!oldLibraries) {
          return oldLibraries
        }

        return oldLibraries.filter((lib) => lib.id !== deletedLibraryId)
      })

      queryClient.setQueriesData<InfiniteData<GETV1LibraryListResponse, string | null>>(
        { queryKey: QueryKeys.infiniteLibraryListBase },
        (oldData) => {
          if (!oldData) {
            return oldData
          }

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              libraries: page.libraries.filter((lib) => lib.id !== deletedLibraryId),
            })),
          }
        },
      )

      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryListBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryMangasBase })

      toast.success('서재가 삭제됐어요')
      onOpenChange(false)
      router.push('/library')
    },
  })

  return (
    <Modal
      className="max-w-xs w-full rounded-xl bg-zinc-900 border border-zinc-800"
      onClose={() => onOpenChange(false)}
      open={open}
    >
      <div className="p-5 relative">
        <div className="flex flex-col items-center text-center mb-5">
          <div className="mb-3 h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center">
            <Trash2 className="size-6 shrink-0 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-100 mb-1">서재 삭제</h2>
          <p className="text-sm text-zinc-400 mb-3 break-all">"{libraryName}" 서재를 삭제할까요?</p>
          {itemCount > 0 && (
            <p className="text-sm text-red-400">
              서재에 {itemCount}개의 작품이 있어요. <br />
              삭제하면 모든 작품이 서재에서 제거돼요.
            </p>
          )}
        </div>
        <div className="grid md:flex gap-3">
          <button
            className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-red-700 text-foreground font-medium 
              hover:bg-red-700 transition-colors disabled:opacity-50 relative"
            disabled={isPending}
            onClick={() => dispatchAction(libraryId)}
            type="button"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} 삭제
          </button>
          <button
            className="flex-1 p-2 rounded-lg bg-zinc-800 text-zinc-300 font-medium 
              hover:bg-zinc-700 transition-colors disabled:opacity-50"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            type="button"
          >
            취소
          </button>
        </div>
      </div>
    </Modal>
  )
}
