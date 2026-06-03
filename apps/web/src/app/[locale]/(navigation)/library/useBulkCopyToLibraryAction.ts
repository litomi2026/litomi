'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { QueryKeys } from '@/lib/react-query/query-keys'

import type { BulkActionDescriptor, BulkTargetLibrary } from './bulkActionTypes'

import { bulkCopyToLibrary } from './api'
import { useLibrarySelection } from './librarySelection'

type Options = {
  libraries: BulkTargetLibrary[]
}

export default function useBulkCopyToLibraryAction({ libraries }: Options): BulkActionDescriptor {
  const queryClient = useQueryClient()
  const { exit, selectedCount, selectedIds } = useLibrarySelection()
  const t = useTranslations('Library.bulk')

  const mutation = useMutation({
    mutationFn: bulkCopyToLibrary,
    onSuccess: ({ copiedCount }, { mangaIds, toLibraryId }) => {
      const alreadyExistsCount = mangaIds.length - copiedCount
      const extraMessage = alreadyExistsCount > 0 ? t('failedSuffix', { count: alreadyExistsCount }) : ''

      toast.success(t('copy.success', { count: copiedCount, extra: extraMessage }))
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraries })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryListBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infinitePublicLibraryMangasBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraryItemsBase(toLibraryId) })
      exit()
    },
  })

  return {
    dialogDescription: t('copy.description', { count: selectedCount }),
    dialogTitle: t('copy.title'),
    disabledReason: libraries.length === 0 ? t('copy.disabledNoLibrary') : undefined,
    emptyMessage: t('copy.empty'),
    icon: Copy,
    id: 'copy',
    label: t('copy.label'),
    libraries,
    onSelectLibrary: (libraryId: number) => {
      mutation.mutate({
        toLibraryId: libraryId,
        mangaIds: Array.from(selectedIds),
      })
    },
    pending: mutation.isPending,
    type: 'library-select',
  }
}
