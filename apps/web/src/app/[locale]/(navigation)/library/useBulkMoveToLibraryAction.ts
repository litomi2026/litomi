'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FolderInput } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { QueryKeys } from '@/lib/react-query/query-keys'

import type { BulkActionDescriptor, BulkTargetLibrary } from './bulkActionTypes'

import { bulkMoveToLibrary } from './api'
import { useLibrarySelection } from './librarySelection'

type Options = {
  currentLibraryId?: number
  libraries: BulkTargetLibrary[]
}

export default function useBulkMoveToLibraryAction({ currentLibraryId, libraries }: Options): BulkActionDescriptor {
  const queryClient = useQueryClient()
  const { exit, selectedCount, selectedIds } = useLibrarySelection()
  const t = useTranslations('Library.bulk')

  const mutation = useMutation({
    mutationFn: bulkMoveToLibrary,
    onSuccess: ({ movedCount }, { fromLibraryId, mangaIds, toLibraryId }) => {
      const alreadyExistsCount = mangaIds.length - movedCount
      const extraMessage = alreadyExistsCount > 0 ? t('failedSuffix', { count: alreadyExistsCount }) : ''

      toast.success(t('move.success', { count: movedCount, extra: extraMessage }))
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraries })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryListBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infinitePublicLibraryMangasBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraryItemsBase(fromLibraryId) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraryItemsBase(toLibraryId) })
      exit()
    },
  })

  function getDisabledReason() {
    if (currentLibraryId == null) {
      return t('move.disabledNoCurrentLibrary')
    }

    if (libraries.length === 0) {
      return t('move.disabledNoLibrary')
    }

    return undefined
  }

  return {
    dialogDescription: t('move.description', { count: selectedCount }),
    dialogTitle: t('move.title'),
    disabledReason: getDisabledReason(),
    emptyMessage: t('move.empty'),
    icon: FolderInput,
    id: 'move',
    label: t('move.label'),
    libraries,
    onSelectLibrary: (libraryId: number) => {
      if (!currentLibraryId) {
        return
      }

      mutation.mutate({
        fromLibraryId: currentLibraryId,
        toLibraryId: libraryId,
        mangaIds: Array.from(selectedIds),
      })
    },
    pending: mutation.isPending,
    type: 'library-select',
  }
}
