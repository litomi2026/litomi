import type {
  DELETEV1MePushSubscriptionResponse,
  POSTV1MePushSubscriptionTestBody,
  POSTV1MePushSubscriptionTestResponse,
} from '@litomi/contracts'

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

export async function sendTestPushNotification(body: POSTV1MePushSubscriptionTestBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/push-subscription/test`

  const { data } = await fetchWithErrorHandling<POSTV1MePushSubscriptionTestResponse>(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
