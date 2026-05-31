'use client'

import type { GETV1LibraryListResponse, LibraryListItem } from '@litomi/contracts'

import { Dialog, DialogBody, DialogFooter, DialogHeader } from '@litomi/ui'
import { type InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import { useRouter } from '@/i18n/navigation'
import { QueryKeys } from '@/lib/react-query/query-keys'

import { deleteLibrary } from './api'

type Props = {
  libraryId: number
  libraryName: string
  itemCount: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function LibraryDeleteModal({ libraryId, libraryName, itemCount, open, onOpenChange }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = useTranslations('Library.deleteModal')
  const commonT = useTranslations('Library.common')

  const deleteLibraryMutation = useMutation({
    mutationFn: deleteLibrary,
    onSuccess: ({ id: deletedLibraryId }) => {
      queryClient.setQueryData<LibraryListItem[]>(QueryKeys.libraries, (oldLibraries) => {
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

      toast.success(t('success'))
      onOpenChange(false)
      router.push('/library')
    },
  })

  return (
    <Dialog ariaLabel={t('title')} className="sm:max-w-sm" onClose={() => onOpenChange(false)} open={open}>
      <DialogHeader onClose={() => onOpenChange(false)} title={t('title')} />

      <DialogBody className="p-5">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center">
            <Trash2 className="size-6 shrink-0 text-red-500" />
          </div>
          <p className="text-sm text-zinc-400 mb-3 break-all">{t('description', { name: libraryName })}</p>
          {itemCount > 0 && (
            <p className="text-sm text-red-400">
              {t('itemWarning', { count: itemCount })} <br />
              {t('itemWarningSuffix')}
            </p>
          )}
        </div>
      </DialogBody>

      <DialogFooter className="flex gap-3">
        <button
          className={twMerge(
            'flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-red-700 text-foreground font-medium',
            'hover:bg-red-700 transition disabled:opacity-50 relative',
          )}
          disabled={deleteLibraryMutation.isPending}
          onClick={() => deleteLibraryMutation.mutate(libraryId)}
          type="button"
        >
          {deleteLibraryMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}{' '}
          {commonT('delete')}
        </button>
        <button
          className={twMerge(
            'flex-1 h-10 rounded-lg bg-zinc-800 text-zinc-300 font-medium',
            'hover:bg-zinc-700 transition disabled:opacity-50',
          )}
          disabled={deleteLibraryMutation.isPending}
          onClick={() => onOpenChange(false)}
          type="button"
        >
          {commonT('cancel')}
        </button>
      </DialogFooter>
    </Dialog>
  )
}
