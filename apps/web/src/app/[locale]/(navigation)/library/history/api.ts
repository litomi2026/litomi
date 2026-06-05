import type { DELETEV1ReadingHistoryBody, DELETEV1ReadingHistoryResponse } from '@litomi/contracts'

import { fetchAPIData } from '@/utils/api-request'

export async function deleteReadingHistory(body: DELETEV1ReadingHistoryBody) {
  const url = '/api/v1/library/history'

  const { data } = await fetchAPIData<DELETEV1ReadingHistoryResponse>(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
