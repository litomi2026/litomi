import type { GETV1BillingPaymentsResponse } from '@litomi/contracts'
import { useInfiniteQuery } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { buildSearchParams, fetchAPIData } from '@/utils/api-request'

export default function usePaymentHistoryQuery() {
  return useInfiniteQuery({
    queryKey: QueryKeys.billingPayments,
    queryFn: async ({ pageParam }) => {
      const search = buildSearchParams({ before: pageParam })
      const url = `/api/v1/billing/payments?${search}`
      const { data } = await fetchAPIData<GETV1BillingPaymentsResponse>(url)
      return data
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 0,
  })
}
