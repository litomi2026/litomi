import type { DELETEV1MeBody, DELETEV1MeResponse } from '@litomi/contracts'

import { fetchAPIData } from '@/utils/api-request'

export async function deleteMyAccount(body: DELETEV1MeBody) {
  const url = '/api/v1/me'

  const { data } = await fetchAPIData<DELETEV1MeResponse>(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
