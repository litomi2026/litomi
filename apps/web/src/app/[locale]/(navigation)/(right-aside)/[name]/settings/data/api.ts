'use client'

import type { POSTV1MeExportBody, POSTV1MeExportResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'

import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function exportUserData(body: POSTV1MeExportBody) {
  const url = new URL('/api/v1/me/export', NEXT_PUBLIC_API_ORIGIN)

  const { data } = await fetchAPIData<POSTV1MeExportResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  return data
}
