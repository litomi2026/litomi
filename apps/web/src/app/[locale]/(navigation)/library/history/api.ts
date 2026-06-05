import type { DELETEV1ReadingHistoryBody, DELETEV1ReadingHistoryResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'

import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_APP_ORIGIN } = env

export async function deleteReadingHistory(body: DELETEV1ReadingHistoryBody) {
  const url = new URL('/api/v1/library/history', NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<DELETEV1ReadingHistoryResponse>(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
