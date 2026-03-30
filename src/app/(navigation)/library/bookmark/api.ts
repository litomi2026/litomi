import type {
  DELETEV1BookmarkBody,
  DELETEV1BookmarkResponse,
} from '@/backend/api/v1/bookmark/DELETE'

import { env } from '@/env/client'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function deleteBookmarks(body: DELETEV1BookmarkBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/bookmark`

  const { data } = await fetchWithErrorHandling<DELETEV1BookmarkResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
