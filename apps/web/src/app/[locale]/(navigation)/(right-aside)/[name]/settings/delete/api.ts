import type { DELETEV1MeBody, DELETEV1MeResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'

import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function deleteMyAccount(body: DELETEV1MeBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me`

  const { data } = await fetchAPIData<DELETEV1MeResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
