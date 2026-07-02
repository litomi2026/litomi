import type { POSTV1ChatSubscriptionResponse } from '@litomi/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

export default function useSubscribeMutation(handle: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ paymentMethodId }: { paymentMethodId: number }) => {
      const pathname = `/api/v1/chat/artist/${handle}/subscription`

      const { data } = await fetchAPIData<POSTV1ChatSubscriptionResponse>(pathname, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId }),
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.chatArtist(handle) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.chatThreads })
    },
  })
}
