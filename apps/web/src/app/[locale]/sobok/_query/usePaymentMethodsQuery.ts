import type { GETV1PaymentMethodsResponse } from '@litomi/contracts'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

export default function usePaymentMethodsQuery(enabled = true) {
  return useQuery({
    queryKey: QueryKeys.paymentMethods,
    queryFn: async () => {
      const { data } = await fetchAPIData<GETV1PaymentMethodsResponse>('/api/v1/billing/payment-methods')
      return data
    },
    enabled,
    staleTime: 0,
  })
}
