import type { GETV1ChatStudioEarningsResponse } from '@litomi/contracts'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

export default function useStudioEarningsQuery() {
  return useQuery({
    queryKey: QueryKeys.chatStudioEarnings,
    queryFn: async () => {
      const url = '/api/v1/chat/studio/earnings'
      const { data } = await fetchAPIData<GETV1ChatStudioEarningsResponse>(url)
      return data
    },
    staleTime: 0,
  })
}
