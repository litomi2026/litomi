import type {
  DELETEV1NotificationBody,
  DELETEV1NotificationResponse,
  PATCHV1NotificationReadAllResponse,
  PATCHV1NotificationReadBody,
  PATCHV1NotificationReadResponse,
} from '@litomi/contracts'

import { fetchAPIData } from '@/utils/api-request'

export async function deleteNotifications(body: DELETEV1NotificationBody) {
  const url = '/api/v1/notification'

  const { data } = await fetchAPIData<DELETEV1NotificationResponse>(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function markAllNotificationsAsRead() {
  const url = '/api/v1/notification/read-all'

  const { data } = await fetchAPIData<PATCHV1NotificationReadAllResponse>(url, {
    method: 'PATCH',
  })

  return data
}

export async function markNotificationsAsRead(body: PATCHV1NotificationReadBody) {
  const url = '/api/v1/notification/read'

  const { data } = await fetchAPIData<PATCHV1NotificationReadResponse>(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
