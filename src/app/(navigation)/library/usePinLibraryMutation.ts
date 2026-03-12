import { useMutation, useQueryClient } from '@tanstack/react-query'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import useMeQuery from '@/query/useMeQuery'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

export default function usePinLibraryMutation() {
  const queryClient = useQueryClient()
  const { data: me } = useMeQuery()

  return useMutation({
    mutationFn: async ({ libraryId, action }: { libraryId: number; action: 'pin' | 'unpin' }) => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/library/${libraryId}/pin`
      const method = action === 'pin' ? 'POST' : 'DELETE'
      const { data } = await fetchWithErrorHandling(url, { method, credentials: 'include' })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.infinitePinnedLibraryList(me?.id) })
    },
    onError: (error) => {
      console.error('서재 고정 중 오류 발생:', error)
    },
  })
}
