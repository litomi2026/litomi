import type { POSTV1ChatArtistBody, POSTV1ChatArtistResponse } from '@litomi/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

export default function useCreateArtistMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: POSTV1ChatArtistBody) => {
      const url = '/api/v1/chat/artist'

      const { data } = await fetchAPIData<POSTV1ChatArtistResponse>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.chatStudio })
    },
  })
}
