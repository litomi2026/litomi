import type { DELETEV1MePushSubscriptionResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'

import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function deletePushSubscription(id: number) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/push-subscription/${id}`

  const { data } = await fetchWithErrorHandling<DELETEV1MePushSubscriptionResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
  })

  return data
}
