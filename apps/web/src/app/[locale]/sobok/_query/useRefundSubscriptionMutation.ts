import type { POSTV1ChatSubscriptionRefundResponse } from '@litomi/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

// 청약철회 — 조건(결제 7일 이내 + 이번 기간 답장 미발신)은 서버가 검증하고,
// 불충족 사유는 problem detail 메시지로 내려와 그대로 표시된다.
export default function useRefundSubscriptionMutation(handle: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const url = `/api/v1/chat/artist/${handle}/subscription/refund`
      const { data } = await fetchAPIData<POSTV1ChatSubscriptionRefundResponse>(url, { method: 'POST' })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.chatArtist(handle) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.chatThreads })
      queryClient.invalidateQueries({ queryKey: QueryKeys.chatMessages(handle) })
    },
  })
}
