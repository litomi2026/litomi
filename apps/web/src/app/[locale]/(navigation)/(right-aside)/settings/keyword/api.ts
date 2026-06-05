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

const { NEXT_PUBLIC_APP_ORIGIN } = env

export async function createNotificationCriteria(body: POSTV1NotificationCriteriaBody) {
  const url = new URL('/api/v1/notification/criteria', NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<POSTV1NotificationCriteriaResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function deleteNotificationCriteria(id: number) {
  const url = new URL(`/api/v1/notification/criteria/${id}`, NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<DELETEV1NotificationCriteriaIdResponse>(url, {
    method: 'DELETE',
  })

  return data
}

export async function updateNotificationCriteria(id: number, body: PATCHV1NotificationCriteriaIdBody) {
  const url = new URL(`/api/v1/notification/criteria/${id}`, NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<PATCHV1NotificationCriteriaIdResponse>(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
