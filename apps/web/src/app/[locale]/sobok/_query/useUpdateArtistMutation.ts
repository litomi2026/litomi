import type { PATCHV1ChatArtistBody, PATCHV1ChatArtistResponse } from '@litomi/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

export default function useUpdateArtistMutation(handle: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: PATCHV1ChatArtistBody) => {
      const url = `/api/v1/chat/artist/${handle}`

      const { data } = await fetchAPIData<PATCHV1ChatArtistResponse>(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.chatStudio })
      queryClient.invalidateQueries({ queryKey: QueryKeys.chatArtist(handle) })
    },
  })
}
