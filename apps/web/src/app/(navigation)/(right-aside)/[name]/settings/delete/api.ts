import { env } from '@litomi/env/env/client'

import type { DELETEV1MeBody, DELETEV1MeResponse } from '@/backend/api/v1/me/DELETE'

import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function deleteMyAccount(body: DELETEV1MeBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me`

  const { data } = await fetchWithErrorHandling<DELETEV1MeResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
