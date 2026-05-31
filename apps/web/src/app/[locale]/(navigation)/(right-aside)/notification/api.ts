import type {
  DELETEV1NotificationBody,
  DELETEV1NotificationResponse,
  PATCHV1NotificationReadAllResponse,
  PATCHV1NotificationReadBody,
  PATCHV1NotificationReadResponse,
} from '@litomi/contracts'

import { env } from '@litomi/env/client'

import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function deleteNotifications(body: DELETEV1NotificationBody) {
  const url = new URL('/api/v1/notification', NEXT_PUBLIC_API_ORIGIN)

  const { data } = await fetchAPIData<DELETEV1NotificationResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function markAllNotificationsAsRead() {
  const url = new URL('/api/v1/notification/read-all', NEXT_PUBLIC_API_ORIGIN)

  const { data } = await fetchAPIData<PATCHV1NotificationReadAllResponse>(url, {
    method: 'PATCH',
    credentials: 'include',
  })

  return data
}

export async function markNotificationsAsRead(body: PATCHV1NotificationReadBody) {
  const url = new URL('/api/v1/notification/read', NEXT_PUBLIC_API_ORIGIN)

  const { data } = await fetchAPIData<PATCHV1NotificationReadResponse>(url, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
