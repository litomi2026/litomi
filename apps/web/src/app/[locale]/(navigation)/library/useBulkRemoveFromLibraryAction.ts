'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { QueryKeys } from '@/lib/react-query/query-keys'

import type { BulkActionDescriptor } from './bulkActionTypes'

import { bulkRemoveFromLibrary } from './api'
import { useLibrarySelection } from './librarySelection'

type Options = {
  libraryId?: number
}

export default function useBulkRemoveFromLibraryAction({ libraryId }: Options): BulkActionDescriptor {
  const queryClient = useQueryClient()
  const { exit, selectedCount, selectedIds } = useLibrarySelection()
  const t = useTranslations('Library.bulk')

  const mutation = useMutation({
    mutationFn: bulkRemoveFromLibrary,
    onSuccess: ({ removedCount }, variables) => {
      if (removedCount === 0) {
        toast.warning(t('remove.alreadyRemoved'))
      } else {
        toast.success(t('remove.success', { count: removedCount }))
      }

      queryClient.invalidateQueries({ queryKey: QueryKeys.libraries })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryListBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryMangasBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraryItemsBase(variables.libraryId) })
      exit()
    },
  })

  return {
    ariaLabel: t('remove.title'),
    confirmLabel: t('remove.label'),
    description: t('remove.description', { count: selectedCount }),
    disabledReason: libraryId == null ? t('move.disabledNoCurrentLibrary') : undefined,
    icon: Trash2,
    id: 'remove',
    label: t('remove.label'),
    onConfirm: () => {
      if (!libraryId) {
        return
      }

      mutation.mutate({
        libraryId,
        mangaIds: Array.from(selectedIds),
      })
    },
    pending: mutation.isPending,
    title: t('remove.title'),
    tone: 'danger',
    type: 'confirm',
    warning: t('remove.warning'),
  }
}
