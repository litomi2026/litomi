'use client'

import { Dialog, DialogBody, DialogFooter, DialogHeader } from '@litomi/ui'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { useRouter } from '@/i18n/navigation'
import { QueryKeys } from '@/lib/react-query/query-keys'
import type { ProblemDetailsError } from '@/utils/fetch-response'

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
}: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = useTranslations('Community')

  const deletePostMutation = useMutation<void, ProblemDetailsError, number, MutationContext>({
    mutationFn: deletePost,
    onMutate: async (mutatingPostId) => {
      await queryClient.cancelQueries({ queryKey: QueryKeys.postsBase })
      const snapshot = snapshotPostLists(queryClient)
      removePostFromPostLists(queryClient, mutatingPostId)
      return { snapshot }
    },
    onError: (_error, _postId, context) => {
      if (context?.snapshot) {
        restorePostLists(queryClient, context.snapshot)
      }
    },
    onSuccess: () => {
      toast.success(t('delete.success'))
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
    <Dialog ariaLabel={t('delete.title')} className="sm:max-w-sm" onClose={() => onOpenChange(false)} open={open}>
      <DialogHeader onClose={() => onOpenChange(false)} title={t('delete.title')} />

      <DialogBody className="p-5">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800">
            <Trash2 className="size-6 shrink-0 text-red-500" />
          </div>
          <p className="text-sm text-zinc-300">{t('delete.description')}</p>
          <p className="mt-2 text-sm text-zinc-500">{t('delete.warning')}</p>
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
          {t('common.delete')}
        </button>
        <button
          className="h-10 flex-1 rounded-lg bg-zinc-800 font-medium text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-50"
          disabled={deletePostMutation.isPending}
          onClick={() => onOpenChange(false)}
          type="button"
        >
          {t('common.cancel')}
        </button>
      </DialogFooter>
    </Dialog>
  )
}
