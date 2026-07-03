import type { PUTV1ChatPayoutAccountBody, PUTV1ChatPayoutAccountResponse } from '@litomi/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

export default function useSavePayoutAccountMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: PUTV1ChatPayoutAccountBody) => {
      const url = '/api/v1/chat/studio/payout-account'

      const { data } = await fetchAPIData<PUTV1ChatPayoutAccountResponse>(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.chatStudioEarnings })
    },
  })
}
