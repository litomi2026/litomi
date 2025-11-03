'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import IconSpinner from '@/components/icons/IconSpinner'
import IconTrash from '@/components/icons/IconTrash'
import Modal from '@/components/ui/Modal'
import useActionResponse from '@/hook/useActionResponse'

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

  const [_, dispatchAction, isPending] = useActionResponse({
    action: deleteLibrary,
    onSuccess: () => {
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
            <IconTrash className="h-6 w-6 text-red-500" />
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
            {isPending ? <IconSpinner className="size-4" /> : <IconTrash className="size-4" />} 삭제
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
