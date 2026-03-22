'use client'

import type {
  POSTV1NotificationCriteriaBody,
  POSTV1NotificationCriteriaResponse,
} from '@/backend/api/v1/notification/criteria/POST'

import { env } from '@/env/client'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

export async function createNotificationCriteria(body: POSTV1NotificationCriteriaBody) {
  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/notification/criteria`

  const { data } = await fetchWithErrorHandling<POSTV1NotificationCriteriaResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  return data
}
