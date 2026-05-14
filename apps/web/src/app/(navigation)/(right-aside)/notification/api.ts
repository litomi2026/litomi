import type {
  DELETEV1NotificationBody,
  DELETEV1NotificationResponse,
  PATCHV1NotificationReadAllResponse,
  PATCHV1NotificationReadBody,
  PATCHV1NotificationReadResponse,
} from '@litomi/contracts/api/notification'

import { env } from '@litomi/env/env/client'

import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function deleteNotifications(body: DELETEV1NotificationBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/notification`

  const { data } = await fetchWithErrorHandling<DELETEV1NotificationResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function markAllNotificationsAsRead() {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/notification/read-all`

  const { data } = await fetchWithErrorHandling<PATCHV1NotificationReadAllResponse>(url, {
    method: 'PATCH',
    credentials: 'include',
  })

  return data
}

export async function markNotificationsAsRead(body: PATCHV1NotificationReadBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/notification/read`

  const { data } = await fetchWithErrorHandling<PATCHV1NotificationReadResponse>(url, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
