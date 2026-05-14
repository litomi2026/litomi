'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import Dialog from '@/components/ui/Dialog'
import DialogBody from '@/components/ui/DialogBody'
import DialogFooter from '@/components/ui/DialogFooter'
import DialogHeader from '@/components/ui/DialogHeader'
import { QueryKeys } from '@/constants/query'
import { ProblemDetailsError } from '@/utils/react-query-error'

import { deletePost } from './api'
import { type PostListSnapshot, removePostFromPostLists, restorePostLists, snapshotPostLists } from './cache'

type MutationContext = {
  snapshot: PostListSnapshot
}

type Props = {
  fallbackUrl?: string
  onOpenChange: (open: boolean) => void
  open: boolean
  postId: number
  redirectOnDelete?: boolean
}

export default function DeletePostDialog({
  fallbackUrl = '/posts/recommend',
  onOpenChange,
  open,
  postId,
  redirectOnDelete = false,
}: Readonly<Props>) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const deletePostMutation = useMutation<void, ProblemDetailsError, number, MutationContext>({
    mutationFn: deletePost,
    onMutate: async (mutatingPostId) => {
      await queryClient.cancelQueries({ queryKey: QueryKeys.postsBase })
      const snapshot = snapshotPostLists(queryClient)
      removePostFromPostLists(queryClient, mutatingPostId)
      return { snapshot }
    },
    onError: (error, _postId, context) => {
      if (context?.snapshot) {
        restorePostLists(queryClient, context.snapshot)
      }

      toast.warning(error.problem.detail)
    },
    onSuccess: () => {
      toast.success('글을 삭제했어요')
      onOpenChange(false)

      if (redirectOnDelete) {
        if (window.history.length > 1) {
          router.back()
        } else {
          router.replace(fallbackUrl)
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.postsBase })
    },
  })

  return (
    <Dialog ariaLabel="글 삭제" className="sm:max-w-sm" onClose={() => onOpenChange(false)} open={open}>
      <DialogHeader onClose={() => onOpenChange(false)} title="글 삭제" />

      <DialogBody className="p-5">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800">
            <Trash2 className="size-6 shrink-0 text-red-500" />
          </div>
          <p className="text-sm text-zinc-300">이 글을 삭제할까요?</p>
          <p className="mt-2 text-sm text-zinc-500">삭제하면 되돌릴 수 없어요.</p>
        </div>
      </DialogBody>

      <DialogFooter className="flex gap-3">
        <button
          className="relative flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-red-700 font-medium text-foreground transition hover:bg-red-600 disabled:opacity-50"
          disabled={deletePostMutation.isPending}
          onClick={() => deletePostMutation.mutate(postId)}
          type="button"
        >
          {deletePostMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}{' '}
          삭제
        </button>
        <button
          className="h-10 flex-1 rounded-lg bg-zinc-800 font-medium text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-50"
          disabled={deletePostMutation.isPending}
          onClick={() => onOpenChange(false)}
          type="button"
        >
          취소
        </button>
      </DialogFooter>
    </Dialog>
  )
}
