import type {
  DELETEV1MePushSubscriptionBody,
  DELETEV1MePushSubscriptionIdResponse,
  DELETEV1MePushSubscriptionResponse,
  PATCHV1MePushSettingsBody,
  PATCHV1MePushSettingsResponse,
  POSTV1MePushSubscriptionBody,
  POSTV1MePushSubscriptionResponse,
  POSTV1MePushTestBody,
  POSTV1MePushTestResponse,
} from '@litomi/contracts'

import { env } from '@litomi/env/client'

import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function createPushSubscription(body: POSTV1MePushSubscriptionBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/push/subscription`

  const { data } = await fetchWithErrorHandling<POSTV1MePushSubscriptionResponse>(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function deletePushSubscription(id: number) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/push/subscription/${id}`

  const { data } = await fetchWithErrorHandling<DELETEV1MePushSubscriptionIdResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
  })

  return data
}

export async function deletePushSubscriptionByEndpoint(body: DELETEV1MePushSubscriptionBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/push/subscription`

  const { data } = await fetchWithErrorHandling<DELETEV1MePushSubscriptionResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function sendTestPushNotification(body: POSTV1MePushTestBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/push/test`

  const { data } = await fetchWithErrorHandling<POSTV1MePushTestResponse>(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function updatePushSettings(body: PATCHV1MePushSettingsBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/push/settings`

  const { data } = await fetchWithErrorHandling<PATCHV1MePushSettingsResponse>(url, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
