import type { GETV1LibraryListResponse, LibraryListItem } from '@litomi/contracts'

import { type InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { QueryKeys } from '@/lib/react-query/query-keys'
import useMeQuery from '@/query/useMeQuery'
import { fetchAPIData } from '@/utils/api-request'

type PinLibraryVariables = {
  libraryId: number
  action: 'pin' | 'unpin'
  library?: LibraryListItem
}

export default function usePinLibraryMutation() {
  const queryClient = useQueryClient()
  const { data: me } = useMeQuery()
  const t = useTranslations('Library.pin')

  return useMutation<unknown, Error, PinLibraryVariables, { previous?: InfiniteData<GETV1LibraryListResponse> }>({
    mutationFn: async ({ libraryId, action }) => {
      const url = `/api/v1/library/${libraryId}/pin`
      const method = action === 'pin' ? 'POST' : 'DELETE'
      const { data } = await fetchAPIData(url, { method })
      return data
    },
    onMutate: async (variables) => {
      const queryKey = QueryKeys.infinitePinnedLibraryList(me?.id)
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<InfiniteData<GETV1LibraryListResponse>>(queryKey)

      queryClient.setQueryData<InfiniteData<GETV1LibraryListResponse>>(queryKey, (old) =>
        updatePinnedLibraryList(old, variables),
      )

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QueryKeys.infinitePinnedLibraryList(me?.id), context.previous)
      }
    },
    onSuccess: (_data, variables) => {
      if (variables.action === 'pin') {
        toast.success(t('pinned'))
      }
    },
  })
}

function updatePinnedLibraryList(
  old: InfiniteData<GETV1LibraryListResponse> | undefined,
  { libraryId, action, library }: PinLibraryVariables,
) {
  const data = old ?? { pages: [{ libraries: [], nextCursor: null }], pageParams: [''] }

  if (action === 'unpin') {
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        libraries: page.libraries.filter((lib) => lib.id !== libraryId),
      })),
    }
  }

  if (!library) {
    return data
  }

  const [firstPage, ...restPages] = data.pages

  if (!firstPage) {
    return data
  }

  return {
    ...data,
    pages: [
      {
        ...firstPage,
        libraries: [
          {
            ...library,
            pinCount: library.pinCount + 1,
          },
          ...firstPage.libraries.filter((lib) => lib.id !== libraryId),
        ],
      },
      ...restPages,
    ],
  }
}
