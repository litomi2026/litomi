import type { GETV1PaymentMethodsResponse } from '@litomi/contracts'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

export async function fetchPaymentMethods() {
  const pathname = '/api/v1/billing/payment-methods'
  const { data } = await fetchAPIData<GETV1PaymentMethodsResponse>(pathname)
  return data
}

export default function usePaymentMethodsQuery(enabled = true) {
  return useQuery({
    queryKey: QueryKeys.paymentMethods,
    queryFn: fetchPaymentMethods,
    enabled,
    staleTime: 0,
  })
}
