import type { DELETEV1MePasskeyResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'

import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function deletePasskey(id: number) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/passkey/${id}`

  const { data } = await fetchWithErrorHandling<DELETEV1MePasskeyResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
  })

  return data
}
