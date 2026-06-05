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

import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_APP_ORIGIN } = env

export async function createPushSubscription(body: POSTV1MePushSubscriptionBody) {
  const url = new URL('/api/v1/me/push/subscription', NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<POSTV1MePushSubscriptionResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function deletePushSubscription(id: number) {
  const url = new URL(`/api/v1/me/push/subscription/${id}`, NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<DELETEV1MePushSubscriptionIdResponse>(url, {
    method: 'DELETE',
  })

  return data
}

export async function deletePushSubscriptionByEndpoint(body: DELETEV1MePushSubscriptionBody) {
  const url = new URL('/api/v1/me/push/subscription', NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<DELETEV1MePushSubscriptionResponse>(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function sendTestPushNotification(body: POSTV1MePushTestBody) {
  const url = new URL('/api/v1/me/push/test', NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<POSTV1MePushTestResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function updatePushSettings(body: PATCHV1MePushSettingsBody) {
  const url = new URL('/api/v1/me/push/settings', NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<PATCHV1MePushSettingsResponse>(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
