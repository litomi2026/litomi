'use client'

import type {
  DELETEV1NotificationCriteriaIdResponse,
  PATCHV1NotificationCriteriaIdBody,
  PATCHV1NotificationCriteriaIdResponse,
  POSTV1NotificationCriteriaBody,
  POSTV1NotificationCriteriaResponse,
} from '@litomi/contracts'

import { env } from '@litomi/env/client'

import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function createNotificationCriteria(body: POSTV1NotificationCriteriaBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/notification/criteria`

  const { data } = await fetchAPIData<POSTV1NotificationCriteriaResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  return data
}

export async function deleteNotificationCriteria(id: number) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/notification/criteria/${id}`

  const { data } = await fetchAPIData<DELETEV1NotificationCriteriaIdResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
  })

  return data
}

export async function updateNotificationCriteria(id: number, body: PATCHV1NotificationCriteriaIdBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/notification/criteria/${id}`

  const { data } = await fetchAPIData<PATCHV1NotificationCriteriaIdResponse>(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  return data
}
