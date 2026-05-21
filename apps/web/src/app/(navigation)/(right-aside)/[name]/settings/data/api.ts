'use client'

import type { POSTV1MeExportBody, POSTV1MeExportResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'

import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function exportUserData(body: POSTV1MeExportBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/export`

  const { data } = await fetchWithErrorHandling<POSTV1MeExportResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  return data
}
