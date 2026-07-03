import type { DELETEV1ChatSubscriptionResponse } from '@litomi/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

export default function useCancelSubscriptionMutation(handle: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const url = `/api/v1/chat/artist/${handle}/subscription`
      const { data } = await fetchAPIData<DELETEV1ChatSubscriptionResponse>(url, { method: 'DELETE' })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.chatArtist(handle) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.chatThreads })
    },
  })
}
