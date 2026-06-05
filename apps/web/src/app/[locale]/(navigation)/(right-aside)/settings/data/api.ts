'use client'

import type { POSTV1MeExportBody, POSTV1MeExportResponse } from '@litomi/contracts'

import { fetchAPIData } from '@/utils/api-request'

export async function exportUserData(body: POSTV1MeExportBody) {
  const url = '/api/v1/me/export'

  const { data } = await fetchAPIData<POSTV1MeExportResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
