import type { POSTV1ChatSubscriptionResponse } from '@litomi/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

export default function useSubscribeMutation(handle: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ paymentMethodId }: { paymentMethodId?: number }) => {
      const url = `/api/v1/chat/artist/${handle}/subscription`

      const { data } = await fetchAPIData<POSTV1ChatSubscriptionResponse>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentMethodId === undefined ? {} : { paymentMethodId }),
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.chatArtist(handle) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.chatThreads })
      // 재구독 시 lapsed 창(paid-window)으로 잘린 타임라인 캐시를 버리고 전체를 다시 받는다.
      queryClient.invalidateQueries({ queryKey: QueryKeys.chatMessages(handle) })
    },
  })
}
