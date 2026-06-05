'use client'

import type { POSTV1NotificationCriteriaBody, POSTV1NotificationCriteriaResponse } from '@litomi/contracts'

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
