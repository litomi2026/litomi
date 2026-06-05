'use client'

import type { POSTV1NotificationCriteriaBody, POSTV1NotificationCriteriaResponse } from '@litomi/contracts'

import { fetchAPIData } from '@/utils/api-request'

export async function createNotificationCriteria(body: POSTV1NotificationCriteriaBody) {
  const url = '/api/v1/notification/criteria'

  const { data } = await fetchAPIData<POSTV1NotificationCriteriaResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
