import { type InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { GETV1LibraryListResponse, LibraryListItem } from '@/backend/api/v1/library/GET'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import useMeQuery from '@/query/useMeQuery'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

export default function usePinLibraryMutation() {
  const queryClient = useQueryClient()
  const { data: me } = useMeQuery()

  return useMutation<
    unknown,
    Error,
    { libraryId: number; action: 'pin' | 'unpin'; library?: LibraryListItem },
    { previous?: InfiniteData<GETV1LibraryListResponse> }
  >({
    mutationFn: async ({ libraryId, action }) => {
      const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/library/${libraryId}/pin`
      const method = action === 'pin' ? 'POST' : 'DELETE'
      const { data } = await fetchWithErrorHandling(url, { method, credentials: 'include' })
      return data
    },
    onMutate: async ({ libraryId, action, library }) => {
      const queryKey = QueryKeys.infinitePinnedLibraryList(me?.id)
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<InfiniteData<GETV1LibraryListResponse>>(queryKey)

      const updater = (
        old: InfiniteData<GETV1LibraryListResponse> | undefined,
      ): InfiniteData<GETV1LibraryListResponse> => {
        const fallback: InfiniteData<GETV1LibraryListResponse> = {
          pages: [{ libraries: [], nextCursor: null }],
          pageParams: [''],
        }

        const data = old ?? fallback

        if (action === 'unpin') {
          return {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              libraries: page.libraries.filter((lib) => lib.id !== libraryId),
            })),
          }
        }

        if (library) {
          return {
            ...data,
            pages: data.pages.map((page, index) => {
              if (index === 0) {
                return {
                  ...page,
                  libraries: [library, ...page.libraries.filter((lib) => lib.id !== libraryId)],
                }
              }
              return page
            }),
          }
        }

        return data
      }

      queryClient.setQueryData<InfiniteData<GETV1LibraryListResponse>>(queryKey, updater)

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QueryKeys.infinitePinnedLibraryList(me?.id), context.previous)
      }
    },
    onSuccess: (_data, variables) => {
      if (variables.action === 'pin') {
        toast.success('서재를 고정했어요')
      }
    },
  })
}
