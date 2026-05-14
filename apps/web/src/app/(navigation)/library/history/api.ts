import type {
  DELETEV1ReadingHistoryBody,
  DELETEV1ReadingHistoryResponse,
} from '@/backend/api/v1/library/history/DELETE'

import { env } from '@/env/client'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function deleteReadingHistory(body: DELETEV1ReadingHistoryBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/library/history`

  const { data } = await fetchWithErrorHandling<DELETEV1ReadingHistoryResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
